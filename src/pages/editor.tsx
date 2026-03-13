import Editor from "@monaco-editor/react";

export default function IDE() {
  return (
    <Editor
      height="500px"
      defaultLanguage="javascript"
      defaultValue="// Write code here"
    />
  );
}