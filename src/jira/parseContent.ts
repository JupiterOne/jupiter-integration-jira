import { TextContent } from ".";

export default function parseContent(
  content: TextContent[] | undefined,
  joinWith: string = "\n\n",
): string {
  return content ? content.map(c => parseContentBlock(c)).join(joinWith) : "";
}

const EMOJI_MAP: { [key: string]: string } = {
  ":check_mark:": "✅",
  ":cross_mark:": "❌",
};

function parseTextStyle(mark: { type: string }): string {
  const type = mark && mark.type;
  switch (type) {
    case "em":
      return "_";
    case "strong":
      return "**";
    case "code":
      return "`";
    default:
      return "";
  }
}

function parseContentBlock(content: TextContent): string {
  switch (content.type) {
    case "panel": {
      return parseContent(content.content) + "\n\n---";
    }
    case "bulletList": {
      return "- " + parseContent(content.content, "\n\n- ");
    }
    case "listItem": {
      return parseContent(content.content, "\n\n  ");
    }
    case "emoji": {
      if (content.attrs && content.attrs.text) {
        return EMOJI_MAP[content.attrs.text] || content.attrs.text;
      } else {
        return "";
      }
    }
    case "codeBlock": {
      if (content.content) {
        const code = content.content.map(c => c.text).join("\n");
        const lang = content.attrs ? content.attrs.language : "";
        return `\`\`\`${lang}\n${code}\n\`\`\``;
      } else {
        return "";
      }
    }
    case "text": {
      if (content.text) {
        let text = content.text;
        for (const mark of content.marks || []) {
          const style = parseTextStyle(mark);
          text = `${style}${text}${style}`;
        }
        return text;
      }
      return "";
    }
    case "mention": {
      return content.attrs ? `@${content.attrs.text}` : "";
    }
    case "hardBreak": {
      return "\n";
    }
    case "blockquote": {
      return content.content
        ? `> ${content.content.map(c => parseContentBlock(c)).join("")}`
        : "> ";
    }
    case "paragraph": {
      return content.content
        ? content.content.map(c => parseContentBlock(c)).join("")
        : "";
    }
    default: {
      if (content.text) {
        return content.text;
      } else if (content.attrs) {
        if (content.attrs.url) {
          const url = content.attrs.url;
          return url.match(/#icft=.+$/)
            ? `[${url.match(/#icft=(.+)$/)![1]}](${url})`
            : `<${url}>`;
        } else if (content.attrs.text) {
          return content.attrs.text;
        }
      }
      return "";
    }
  }
}

export function parseNumber(s: string | number): number | string {
  if (typeof s !== "string") {
    return s;
  }
  const NUM_REGEX = /^[\d,]*(\.[\d]*)?(e[\d]*)?$/;
  const match = s.match(NUM_REGEX);
  if (match) {
    const numStr = s.replace(",", "");
    return match[1] || match[2] ? parseFloat(numStr) : parseInt(numStr, 10);
  } else {
    return s;
  }
}
