// Small ICU MessageFormat subset, no dependency:
//   {name}                                   – variable
//   {count, plural, =0 {…} one {…} other {…}} – plural (CLDR rules via Intl.PluralRules); # = the number
//   {role, select, owner {…} other {…}}       – select
// Nested messages inside plural / select branches are supported. Apostrophes are
// plain text (no ICU quoting). Unknown variables render as an empty string.

export type MessageVars = Record<string, string | number | undefined | null>;

type Node =
  | { t: "text"; v: string }
  | { t: "var"; name: string }
  | { t: "hash" }
  | { t: "plural"; name: string; offset: number; opts: Record<string, Node[]> }
  | { t: "select"; name: string; opts: Record<string, Node[]> };

const cache = new Map<string, Node[]>();

function parse(src: string): Node[] {
  let i = 0;

  function parseNodes(inPlural: boolean, stopAtBrace: boolean): Node[] {
    const out: Node[] = [];
    let text = "";
    const flush = () => {
      if (text) out.push({ t: "text", v: text });
      text = "";
    };
    while (i < src.length) {
      const c = src[i];
      if (c === "}" && stopAtBrace) break;
      if (c === "#" && inPlural) {
        flush();
        out.push({ t: "hash" });
        i++;
        continue;
      }
      if (c === "{") {
        flush();
        i++;
        out.push(parseArg());
        continue;
      }
      text += c;
      i++;
    }
    flush();
    return out;
  }

  function readUntil(chars: string): string {
    let s = "";
    while (i < src.length && !chars.includes(src[i])) s += src[i++];
    return s.trim();
  }

  function parseOptions(inPlural: boolean): Record<string, Node[]> {
    const opts: Record<string, Node[]> = {};
    while (i < src.length) {
      while (i < src.length && /\s/.test(src[i])) i++;
      if (src[i] === "}") break;
      const key = readUntil("{}").trim();
      if (src[i] !== "{") break;
      i++; // {
      opts[key] = parseNodes(inPlural, true);
      i++; // }
    }
    return opts;
  }

  function parseArg(): Node {
    const name = readUntil(",}");
    if (src[i] === "}") {
      i++;
      return { t: "var", name };
    }
    i++; // ,
    const type = readUntil(",}");
    if (src[i] === "}") {
      // {x, number} and similar: treat as a plain variable
      i++;
      return { t: "var", name };
    }
    i++; // ,
    let offset = 0;
    if (type === "plural") {
      while (/\s/.test(src[i] ?? "")) i++;
      const m = /^offset:(\d+)/.exec(src.slice(i));
      if (m) {
        offset = Number(m[1]);
        i += m[0].length;
      }
    }
    const opts = parseOptions(type === "plural");
    i++; // closing }
    return type === "plural" ? { t: "plural", name, offset, opts } : { t: "select", name, opts };
  }

  return parseNodes(false, false);
}

function render(nodes: Node[], vars: MessageVars, locale: string, num?: number): string {
  let out = "";
  for (const n of nodes) {
    if (n.t === "text") out += n.v;
    else if (n.t === "hash") out += num === undefined ? "#" : new Intl.NumberFormat(locale).format(num);
    else if (n.t === "var") {
      const v = vars[n.name];
      out += v === undefined || v === null ? "" : typeof v === "number" ? new Intl.NumberFormat(locale).format(v) : v;
    } else if (n.t === "plural") {
      const raw = Number(vars[n.name] ?? 0);
      const value = raw - n.offset;
      const exact = n.opts[`=${raw}`];
      const cat = new Intl.PluralRules(locale).select(value);
      const branch = exact ?? n.opts[cat] ?? n.opts.other ?? [];
      out += render(branch, vars, locale, value);
    } else {
      const v = String(vars[n.name] ?? "other");
      out += render(n.opts[v] ?? n.opts.other ?? [], vars, locale, num);
    }
  }
  return out;
}

export function formatMessage(message: string, vars: MessageVars = {}, locale = "en"): string {
  if (!message.includes("{") && !message.includes("#")) return message;
  let nodes = cache.get(message);
  if (!nodes) {
    try {
      nodes = parse(message);
    } catch {
      return message;
    }
    cache.set(message, nodes);
  }
  return render(nodes, vars, locale);
}
