"use client";

import { useEffect, useRef } from "react";
import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from "react-hook-form";
import { EditorContent, useEditor } from "@tiptap/react";
import { RichTextProvider } from "reactjs-tiptap-editor";
import { Document } from "@tiptap/extension-document";
import { Text } from "@tiptap/extension-text";
import { Paragraph } from "@tiptap/extension-paragraph";
import {
  Dropcursor,
  Gapcursor,
  Placeholder,
  TrailingNode,
} from "@tiptap/extensions";
import { HardBreak } from "@tiptap/extension-hard-break";
import { TextStyle } from "@tiptap/extension-text-style";
import { ListItem } from "@tiptap/extension-list";

import {
  History,
  RichTextUndo,
  RichTextRedo,
} from "reactjs-tiptap-editor/history";
import { Bold, RichTextBold } from "reactjs-tiptap-editor/bold";
import { Italic, RichTextItalic } from "reactjs-tiptap-editor/italic";
import {
  TextUnderline,
  RichTextUnderline,
} from "reactjs-tiptap-editor/textunderline";
import { Strike, RichTextStrike } from "reactjs-tiptap-editor/strike";
import { MoreMark, RichTextMoreMark } from "reactjs-tiptap-editor/moremark";
import {
  FontFamily,
  RichTextFontFamily,
} from "reactjs-tiptap-editor/fontfamily";
import { FontSize, RichTextFontSize } from "reactjs-tiptap-editor/fontsize";
import { Color, RichTextColor } from "reactjs-tiptap-editor/color";
import { Highlight, RichTextHighlight } from "reactjs-tiptap-editor/highlight";
import { Heading, RichTextHeading } from "reactjs-tiptap-editor/heading";
import {
  BulletList,
  RichTextBulletList,
} from "reactjs-tiptap-editor/bulletlist";
import {
  OrderedList,
  RichTextOrderedList,
} from "reactjs-tiptap-editor/orderedlist";
import { TaskList, RichTextTaskList } from "reactjs-tiptap-editor/tasklist";
import { TextAlign, RichTextAlign } from "reactjs-tiptap-editor/textalign";
import { Indent, RichTextIndent } from "reactjs-tiptap-editor/indent";
import { Link, RichTextLink } from "reactjs-tiptap-editor/link";
import {
  Blockquote,
  RichTextBlockquote,
} from "reactjs-tiptap-editor/blockquote";
import {
  HorizontalRule,
  RichTextHorizontalRule,
} from "reactjs-tiptap-editor/horizontalrule";
import { Code, RichTextCode } from "reactjs-tiptap-editor/code";
import { CodeBlock, RichTextCodeBlock } from "reactjs-tiptap-editor/codeblock";
import { Table, RichTextTable } from "reactjs-tiptap-editor/table";
import {
  SearchAndReplace,
  RichTextSearchAndReplace,
} from "reactjs-tiptap-editor/searchandreplace";
import { Clear, RichTextClear } from "reactjs-tiptap-editor/clear";
import {
  SlashCommand,
  SlashCommandList,
} from "reactjs-tiptap-editor/slashcommand";
import { createLowlight, common } from "lowlight";
import {
  RichTextBubbleText,
  RichTextBubbleLink,
  RichTextBubbleTable,
  RichTextBubbleCodeBlock,
  RichTextBubbleMenuDragHandle,
} from "reactjs-tiptap-editor/bubble";
import { localeActions } from "reactjs-tiptap-editor/locale-bundle";
import { themeActions } from "reactjs-tiptap-editor/theme";
import "reactjs-tiptap-editor/style.css";

import { cn } from "@/lib/utils";
import { FormFieldWrapper } from "./FormFieldWrapper";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommonRichTextEditorProps {
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  description?: string;
  required?: boolean;
  dark?: boolean;
}

type RHFRichTextEditorProps<T extends FieldValues> =
  CommonRichTextEditorProps & {
    control: Control<T>;
    name: Path<T>;
    value?: never;
    onChange?: never;
  };

type ControlledRichTextEditorProps = CommonRichTextEditorProps & {
  control?: never;
  name?: never;
  value: string;
  onChange: (val: string) => void;
};

export type CustomRichTextEditorProps<T extends FieldValues> =
  | RHFRichTextEditorProps<T>
  | ControlledRichTextEditorProps;

// ─── Core ─────────────────────────────────────────────────────────────────────

const lowlight = createLowlight(common);

const BASE_EXTENSIONS = [
  Document,
  Text,
  Paragraph,
  Dropcursor,
  Gapcursor,
  HardBreak,
  TrailingNode,
  ListItem,
  TextStyle,
  History,
  Bold,
  Italic,
  TextUnderline,
  Strike,
  MoreMark,
  FontFamily,
  FontSize,
  Color,
  Highlight,
  Heading,
  BulletList,
  OrderedList,
  TaskList,
  TextAlign,
  Indent,
  Link,
  Blockquote,
  HorizontalRule,
  Code,
  CodeBlock.configure({ lowlight }),
  Table,
  SearchAndReplace,
  Clear,
  SlashCommand,
];

interface RichTextEditorCoreProps extends CommonRichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}

function RichTextEditorCore({
  label,
  placeholder,
  disabled,
  className,
  description,
  required,
  dark = false,
  value,
  onChange,
  error,
}: RichTextEditorCoreProps) {
  useEffect(() => {
    localeActions.setLang("en");
    themeActions.setTheme(dark ? "dark" : "light");
  }, [dark]);

  // Track the last HTML the editor emitted, so we can skip echo-syncs from
  // parent re-renders and only call setContent for genuine external changes.
  const lastEmittedRef = useRef(value);

  const editor = useEditor({
    extensions: [
      ...BASE_EXTENSIONS,
      Placeholder.configure({
        placeholder: placeholder ?? "Start typing...",
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      lastEmittedRef.current = html;
      onChange(html);
    },
  });

  // Sync external value changes (e.g. form reset / defaultValues load).
  // Skip when the incoming value is just our own emission echoed back.
  useEffect(() => {
    if (!editor) return;
    if (value === lastEmittedRef.current) return;
    lastEmittedRef.current = value;
    editor.commands.setContent(value ?? "", { emitUpdate: false });
  }, [editor, value]);

  // Sync disabled state
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  return (
    <FormFieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <RichTextProvider editor={editor}>
        <div
          className={cn(
            "rounded-md border border-input bg-background text-sm",
            error && "border-destructive",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-0.5 border-b border-input p-1">
            {/* History */}
            <RichTextUndo />
            <RichTextRedo />
            <Divider />

            {/* Font */}
            <RichTextFontFamily />
            <RichTextFontSize />
            <Divider />

            {/* Heading */}
            <RichTextHeading />
            <Divider />

            {/* Inline formatting */}
            <RichTextBold />
            <RichTextItalic />
            <RichTextUnderline />
            <RichTextStrike />
            <RichTextCode />
            <RichTextMoreMark />
            <Divider />

            {/* Color */}
            <RichTextColor />
            <RichTextHighlight />
            <Divider />

            {/* Alignment */}
            <RichTextAlign />
            <RichTextIndent />
            <Divider />

            {/* Lists */}
            <RichTextBulletList />
            <RichTextOrderedList />
            <RichTextTaskList />
            <Divider />

            {/* Blocks */}
            <RichTextBlockquote />
            <RichTextCodeBlock />
            <RichTextHorizontalRule />
            <RichTextTable />
            <Divider />

            {/* Link */}
            <RichTextLink />
            <Divider />

            {/* Utilities */}
            <RichTextSearchAndReplace />
            <RichTextClear />
          </div>

          {/* Editor area */}
          <div className="min-h-40 px-3 py-2 focus-within:ring-1 focus-within:ring-ring [&_.ProseMirror]:min-h-36 [&_.ProseMirror]:outline-none">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Bubble menus */}
        <RichTextBubbleText />
        <RichTextBubbleLink />
        <RichTextBubbleTable />
        <RichTextBubbleCodeBlock />
        <RichTextBubbleMenuDragHandle />

        {/* Slash command palette */}
        <SlashCommandList />
      </RichTextProvider>
    </FormFieldWrapper>
  );
}

function Divider() {
  return <div className="mx-0.5 h-5 w-px self-center bg-border" />;
}

// ─── RHF wrapper ──────────────────────────────────────────────────────────────

function RHFRichTextEditor<T extends FieldValues>({
  control,
  name,
  ...props
}: RHFRichTextEditorProps<T>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <RichTextEditorCore
      {...props}
      value={field.value ?? ""}
      onChange={field.onChange}
      error={fieldState.error?.message}
    />
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export function CustomRichTextEditor<T extends FieldValues>(
  props: CustomRichTextEditorProps<T>,
) {
  if ("control" in props && props.control !== undefined) {
    return <RHFRichTextEditor {...(props as RHFRichTextEditorProps<T>)} />;
  }
  const { value, onChange, ...rest } = props as ControlledRichTextEditorProps;
  return <RichTextEditorCore {...rest} value={value} onChange={onChange} />;
}
