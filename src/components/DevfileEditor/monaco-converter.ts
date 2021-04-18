/*
 * Copyright (c) 2018-2020 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

// copied from https://github.com/TypeFox/monaco-languageclient/blob/v0.13.0/client/src/monaco-converter.ts

/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as _monaco from 'monaco-editor-core';
import {
  Diagnostic, CompletionItem, CompletionList,
  Hover, Location,
  SymbolInformation, Command, TextEdit,
  ColorInformation, ColorPresentation, DocumentSymbol,
  Position, TextDocumentIdentifier,
  InsertTextFormat, Range, CompletionItemKind,
  FormattingOptions,
  MarkedString, MarkupContent,
  DiagnosticRelatedInformation, MarkupKind, SymbolKind,
} from 'vscode-languageserver-protocol';

export type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

export interface ProtocolCompletionItem extends _monaco.languages.CompletionItem {
  data?: any;
  fromEdit?: boolean;
  documentationFormat?: string;
  originalItemKind?: CompletionItemKind;
  deprecated?: boolean;
}

// eslint-disable-next-line
export namespace ProtocolCompletionItem {
  export function is(item: any): item is ProtocolCompletionItem {
    return !!item && 'data' in item;
  }
}

type RangeReplace = { insert: _monaco.IRange; replace: _monaco.IRange }

function isRangeReplace(value: Partial<_monaco.IRange> | RangeReplace): value is RangeReplace {
  return (value as RangeReplace).insert !== undefined;
}

export class MonacoToProtocolConverter {
  asPosition(lineNumber: undefined | null, column: undefined | null): {};
  asPosition(lineNumber: number, column: number): Position;
  asPosition(lineNumber: number | undefined | null, column: number | undefined | null): Partial<Position> {
    const line = lineNumber === undefined || lineNumber === null ? undefined : lineNumber - 1;
    const character = column === undefined || column === null ? undefined : column - 1;
    return {
      line, character,
    };
  }

  asRange(range: _monaco.IRange): Range;
  asRange(range: _monaco.IRange | { insert: _monaco.IRange; replace: _monaco.IRange }): Range;
  asRange(range: Partial<_monaco.IRange> | undefined | null | RangeReplace): RecursivePartial<Range> | undefined | null {
    if (range === undefined) {
      return undefined;
    }
    if (range === null) {
      return null;
    }

    if (isRangeReplace(range)) {
      return this.asRange(range.insert);

    } else {
      const start = this.asPosition((range as any).startLineNumber, (range as any).startColumn);
      const end = this.asPosition((range as any).endLineNumber, (range as any).endColumn);
      return {
        start, end,
      };
    }
  }

  asCompletionItem(item: _monaco.languages.CompletionItem): CompletionItem {
    const result: CompletionItem = { label: item.label as any };
    const protocolItem = ProtocolCompletionItem.is(item) ? item : undefined;
    if (item.detail) {
      result.detail = item.detail;
    }
    if (item.documentation) {
      if (!protocolItem || !protocolItem.documentationFormat) {
        result.documentation = item.documentation as string;
      } else {
        result.documentation = this.asDocumentation(protocolItem.documentationFormat, item.documentation);
      }
    }
    if (item.filterText) {
      result.filterText = item.filterText;
    }
    this.fillPrimaryInsertText(result, item as ProtocolCompletionItem);
    if (typeof item.kind === 'number') {
      result.kind = this.asCompletionItemKind(item.kind, (protocolItem && protocolItem.originalItemKind) as any);
    }
    if (item.sortText) {
      result.sortText = item.sortText;
    }
    if (item.additionalTextEdits) {
      result.additionalTextEdits = this.asTextEdits(item.additionalTextEdits);
    }
    if (item.command) {
      result.command = this.asCommand(item.command);
    }
    if (item.commitCharacters) {
      result.commitCharacters = item.commitCharacters.slice();
    }
    if (item.command) {
      result.command = this.asCommand(item.command);
    }
    if (protocolItem) {
      if (protocolItem.data !== undefined) {
        result.data = protocolItem.data;
      }
      if (protocolItem.deprecated === true || protocolItem.deprecated === false) {
        result.deprecated = protocolItem.deprecated;
      }
    }
    return result;
  }

  protected asCompletionItemKind(value: _monaco.languages.CompletionItemKind, original: CompletionItemKind | undefined): CompletionItemKind {
    if (original !== undefined) {
      return original;
    }
    switch (value) {
      case _monaco.languages.CompletionItemKind.Method:
        return CompletionItemKind.Method;
      case _monaco.languages.CompletionItemKind.Function:
        return CompletionItemKind.Function;
      case _monaco.languages.CompletionItemKind.Constructor:
        return CompletionItemKind.Constructor;
      case _monaco.languages.CompletionItemKind.Field:
        return CompletionItemKind.Field;
      case _monaco.languages.CompletionItemKind.Variable:
        return CompletionItemKind.Variable;
      case _monaco.languages.CompletionItemKind.Class:
        return CompletionItemKind.Class;
      case _monaco.languages.CompletionItemKind.Struct:
        return CompletionItemKind.Struct;
      case _monaco.languages.CompletionItemKind.Interface:
        return CompletionItemKind.Interface;
      case _monaco.languages.CompletionItemKind.Module:
        return CompletionItemKind.Module;
      case _monaco.languages.CompletionItemKind.Property:
        return CompletionItemKind.Property;
      case _monaco.languages.CompletionItemKind.Event:
        return CompletionItemKind.Event;
      case _monaco.languages.CompletionItemKind.Operator:
        return CompletionItemKind.Operator;
      case _monaco.languages.CompletionItemKind.Unit:
        return CompletionItemKind.Unit;
      case _monaco.languages.CompletionItemKind.Value:
        return CompletionItemKind.Value;
      case _monaco.languages.CompletionItemKind.Constant:
        return CompletionItemKind.Constant;
      case _monaco.languages.CompletionItemKind.Enum:
        return CompletionItemKind.Enum;
      case _monaco.languages.CompletionItemKind.EnumMember:
        return CompletionItemKind.EnumMember;
      case _monaco.languages.CompletionItemKind.Keyword:
        return CompletionItemKind.Keyword;
      case _monaco.languages.CompletionItemKind.Text:
        return CompletionItemKind.Text;
      case _monaco.languages.CompletionItemKind.Color:
        return CompletionItemKind.Color;
      case _monaco.languages.CompletionItemKind.File:
        return CompletionItemKind.File;
      case _monaco.languages.CompletionItemKind.Reference:
        return CompletionItemKind.Reference;
      case _monaco.languages.CompletionItemKind.Customcolor:
        return CompletionItemKind.Color;
      case _monaco.languages.CompletionItemKind.Folder:
        return CompletionItemKind.Folder;
      case _monaco.languages.CompletionItemKind.TypeParameter:
        return CompletionItemKind.TypeParameter;
      case _monaco.languages.CompletionItemKind.Snippet:
        return CompletionItemKind.Snippet;
      default:
        return value + 1 as CompletionItemKind;
    }
  }

  protected asDocumentation(format: string, documentation: string | _monaco.IMarkdownString): string | MarkupContent {
    switch (format) {
      case MarkupKind.PlainText:
        return { kind: format, value: documentation as string };
      case MarkupKind.Markdown:
        return { kind: format, value: (documentation as _monaco.IMarkdownString).value };
      default:
        return `Unsupported Markup content received. Kind is: ${format}`;
    }
  }

  protected fillPrimaryInsertText(target: CompletionItem, source: ProtocolCompletionItem): void {
    let format: InsertTextFormat = InsertTextFormat.PlainText;
    let range: Range | undefined;
    if (source.insertTextRules !== undefined && (source.insertTextRules & _monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet) === 0) {
      format = InsertTextFormat.Snippet;
    }
    target.insertTextFormat = format;

    const text = source.insertText;
    if (source.range) {
      range = this.asRange(source.range);
    }

    target.insertTextFormat = format;
    if (source.fromEdit && text && range) {
      target.textEdit = { newText: text, range: range };
    } else {
      target.insertText = text;
    }
  }

  asTextEdit(edit: _monaco.editor.ISingleEditOperation): TextEdit {
    const range = this.asRange(edit.range)!;

    return {
      range,
      newText: edit.text || '',
    };
  }

  asTextEdits(items: _monaco.editor.ISingleEditOperation[]): TextEdit[];
  asTextEdits(items: _monaco.editor.ISingleEditOperation[] | undefined | null): TextEdit[] | undefined {
    if (!items) {
      return undefined;
    }
    return items.map(item => this.asTextEdit(item));
  }

  asCommand(item: _monaco.languages.Command | undefined | null): Command | undefined {
    if (item) {
      const args = item.arguments || [];
      return Command.create(item.title, item.id, ...args);
    }
    return undefined;
  }
}

export class ProtocolToMonacoConverter {

  asTextEdit(edit: TextEdit): _monaco.languages.TextEdit;
  asTextEdit(edit: undefined | null): undefined;
  asTextEdit(edit: TextEdit | undefined | null): undefined;
  asTextEdit(edit: TextEdit | undefined | null): _monaco.languages.TextEdit | undefined {
    if (!edit) {
      return undefined;
    }
    const range = this.asRange((edit as any).range)!;
    return {
      range,
      text: edit.newText,
    };
  }

  asTextEdits(items: TextEdit[]): _monaco.languages.TextEdit[];
  asTextEdits(items: TextEdit[] | undefined | null): _monaco.languages.TextEdit[] | undefined {
    if (!items) {
      return undefined;
    }
    return items.map(item => this.asTextEdit(item));
  }

  asCommand(command: Command): _monaco.languages.Command;
  asCommand(command: Command | undefined): _monaco.languages.Command | undefined {
    if (!command) {
      return undefined;
    }
    return {
      id: command.command,
      title: command.title,
      arguments: command.arguments,
    };
  }

  asDocumentSymbol(value: DocumentSymbol): _monaco.languages.DocumentSymbol {
    const children = value.children && value.children.map(child => this.asDocumentSymbol(child));
    return {
      name: value.name,
      detail: value.detail || '',
      kind: this.asSymbolKind(value.kind),
      tags: [],
      range: this.asRange((value as any).range) as any,
      selectionRange: this.asRange((value as any).selectionRange) as any,
      children,
    };
  }

  asSymbolInformations(values: SymbolInformation[], uri?: _monaco.Uri): _monaco.languages.DocumentSymbol[];
  asSymbolInformations(values: SymbolInformation[] | undefined | null, uri?: _monaco.Uri): _monaco.languages.DocumentSymbol[] | undefined {
    if (!values) {
      return undefined;
    }
    return values.map(information => this.asSymbolInformation(information, uri));
  }

  asSymbolInformation(item: SymbolInformation, uri?: _monaco.Uri): _monaco.languages.DocumentSymbol {
    const location = this.asLocation(uri ? { ...item.location, uri: uri.toString() } : item.location);
    return {
      name: item.name,
      detail: '',
      containerName: item.containerName,
      kind: this.asSymbolKind(item.kind),
      tags: [],
      range: location.range,
      selectionRange: location.range,
    };
  }

  asSymbolKind(item: SymbolKind): _monaco.languages.SymbolKind {
    if (item <= SymbolKind.TypeParameter) {
      return item - 1;
    }
    return _monaco.languages.SymbolKind.Property;
  }

  asLocation(item: Location): _monaco.languages.Location;
  asLocation(item: Location | undefined | null): _monaco.languages.Location | undefined {
    if (!item) {
      return undefined;
    }
    const uri = _monaco.Uri.parse(item.uri);
    const range = this.asRange((item as any).range)!;
    return {
      uri, range,
    };
  }

  asHover(hover: Hover): _monaco.languages.Hover;
  asHover(hover: Hover | undefined | null): _monaco.languages.Hover | undefined {
    if (!hover) {
      return undefined;
    }
    return {
      contents: this.asHoverContent(hover.contents),
      range: this.asRange((hover as any).range) as any,
    };
  }

  asHoverContent(contents: MarkedString | MarkedString[] | MarkupContent): _monaco.IMarkdownString[] {
    if (Array.isArray(contents)) {
      return contents.map(content => this.asMarkdownString(content));
    }
    return [this.asMarkdownString(contents)];
  }

  asDocumentation(value: string | MarkupContent): string | _monaco.IMarkdownString {
    if (typeof value === 'string') {
      return value;
    }
    if ((value as MarkupContent).kind === MarkupKind.PlainText) {
      return (value as MarkupContent).value;
    }
    return this.asMarkdownString(value);
  }

  asMarkdownString(content: MarkedString | MarkupContent): _monaco.IMarkdownString {
    if (MarkupContent.is(content)) {
      return {
        value: content.value,
      };
    }
    const { language, value } = content as any;

    if (!language && !value) {
      return { value: content.toString() };
    }

    return {
      value: '```' + language + '\n' + value + '\n```',
    };
  }

  asSeverity(severity?: number): _monaco.MarkerSeverity {
    if (severity === 1) {
      return _monaco.MarkerSeverity.Error;
    }
    if (severity === 2) {
      return _monaco.MarkerSeverity.Warning;
    }
    if (severity === 3) {
      return _monaco.MarkerSeverity.Info;
    }
    return _monaco.MarkerSeverity.Hint;
  }

  asDiagnostics(diagnostics: undefined): undefined;
  asDiagnostics(diagnostics: Diagnostic[] | undefined): _monaco.editor.IMarkerData[] | undefined {
    if (!diagnostics) {
      return undefined;
    }
    return diagnostics.map(diagnostic => this.asDiagnostic(diagnostic));
  }

  asDiagnostic(diagnostic: Diagnostic): _monaco.editor.IMarkerData {
    return {
      code: typeof diagnostic.code === 'number' ? diagnostic.code.toString() : diagnostic.code,
      severity: this.asSeverity(diagnostic.severity),
      message: diagnostic.message,
      source: diagnostic.source,
      startLineNumber: diagnostic.range.start.line + 1,
      startColumn: diagnostic.range.start.character + 1,
      endLineNumber: diagnostic.range.end.line + 1,
      endColumn: diagnostic.range.end.character + 1,
      relatedInformation: this.asRelatedInformations(diagnostic.relatedInformation),
    };
  }

  asRelatedInformations(relatedInformation?: DiagnosticRelatedInformation[]): _monaco.editor.IRelatedInformation[] | undefined {
    if (!relatedInformation) {
      return undefined;
    }
    return relatedInformation.map(item => this.asRelatedInformation(item));
  }

  asRelatedInformation(relatedInformation: DiagnosticRelatedInformation): _monaco.editor.IRelatedInformation {
    return {
      resource: _monaco.Uri.parse(relatedInformation.location.uri),
      startLineNumber: relatedInformation.location.range.start.line + 1,
      startColumn: relatedInformation.location.range.start.character + 1,
      endLineNumber: relatedInformation.location.range.end.line + 1,
      endColumn: relatedInformation.location.range.end.character + 1,
      message: relatedInformation.message,
    };
  }

  asCompletionResult(result: CompletionItem[] | CompletionList | null | undefined, defaultRange: _monaco.IRange): _monaco.languages.CompletionList {
    if (!result) {
      return {
        incomplete: false,
        suggestions: [],
      };
    }
    if (Array.isArray(result)) {
      const suggestions = result.map(item => this.asCompletionItem(item, defaultRange));
      return {
        incomplete: false,
        suggestions,
      };
    }
    return {
      incomplete: result.isIncomplete,
      suggestions: result.items.map(item => this.asCompletionItem(item, defaultRange)),
    };
  }

  asCompletionItem(item: CompletionItem, defaultRange: _monaco.IRange | RangeReplace): ProtocolCompletionItem {
    const result = <ProtocolCompletionItem>{ label: item.label };
    if (item.detail) {
      result.detail = item.detail;
    }
    if (item.documentation) {
      result.documentation = this.asDocumentation(item.documentation);
      result.documentationFormat = typeof item.documentation === 'string' ? undefined : (item.documentation as any).kind;
    }
    if (item.filterText) {
      result.filterText = item.filterText;
    }
    const insertText = this.asCompletionInsertText(item, defaultRange);
    result.insertText = insertText.insertText;
    result.range = insertText.range;
    result.fromEdit = insertText.fromEdit;
    if (insertText.isSnippet) {
      result.insertTextRules = _monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
    }
    if (typeof item.kind === 'number') {
      const [itemKind, original] = this.asCompletionItemKind((item as any).kind);
      result.kind = itemKind;
      if (original) {
        result.originalItemKind = original;
      }
    }
    if (item.sortText) {
      result.sortText = item.sortText;
    }
    if (item.additionalTextEdits) {
      result.additionalTextEdits = this.asTextEdits(item.additionalTextEdits);
    }
    if (Array.isArray(item.commitCharacters)) {
      result.commitCharacters = (item as any).commitCharacters.slice();
    }
    if (item.command) {
      result.command = this.asCommand(item.command);
    }
    if (item.deprecated === true || item.deprecated === false) {
      result.deprecated = item.deprecated;
    }
    if (item.preselect === true || item.preselect === false) {
      result.preselect = item.preselect;
    }
    if (item.data !== undefined) {
      result.data = item.data;
    }
    if (item.deprecated === true || item.deprecated === false) {
      result.deprecated = item.deprecated;
    }
    return result;
  }

  asCompletionItemKind(value: CompletionItemKind): [_monaco.languages.CompletionItemKind, CompletionItemKind | undefined] {
    if (CompletionItemKind.Text <= value && value <= CompletionItemKind.TypeParameter) {
      switch (value) {
        case CompletionItemKind.Text:
          return [_monaco.languages.CompletionItemKind.Text, undefined];
        case CompletionItemKind.Method:
          return [_monaco.languages.CompletionItemKind.Method, undefined];
        case CompletionItemKind.Function:
          return [_monaco.languages.CompletionItemKind.Function, undefined];
        case CompletionItemKind.Constructor:
          return [_monaco.languages.CompletionItemKind.Constructor, undefined];
        case CompletionItemKind.Field:
          return [_monaco.languages.CompletionItemKind.Field, undefined];
        case CompletionItemKind.Variable:
          return [_monaco.languages.CompletionItemKind.Variable, undefined];
        case CompletionItemKind.Class:
          return [_monaco.languages.CompletionItemKind.Class, undefined];
        case CompletionItemKind.Interface:
          return [_monaco.languages.CompletionItemKind.Interface, undefined];
        case CompletionItemKind.Module:
          return [_monaco.languages.CompletionItemKind.Module, undefined];
        case CompletionItemKind.Property:
          return [_monaco.languages.CompletionItemKind.Property, undefined];
        case CompletionItemKind.Unit:
          return [_monaco.languages.CompletionItemKind.Unit, undefined];
        case CompletionItemKind.Value:
          return [_monaco.languages.CompletionItemKind.Value, undefined];
        case CompletionItemKind.Enum:
          return [_monaco.languages.CompletionItemKind.Enum, undefined];
        case CompletionItemKind.Keyword:
          return [_monaco.languages.CompletionItemKind.Keyword, undefined];
        case CompletionItemKind.Snippet:
          return [_monaco.languages.CompletionItemKind.Snippet, undefined];
        case CompletionItemKind.Color:
          return [_monaco.languages.CompletionItemKind.Color, undefined];
        case CompletionItemKind.File:
          return [_monaco.languages.CompletionItemKind.File, undefined];
        case CompletionItemKind.Reference:
          return [_monaco.languages.CompletionItemKind.Reference, undefined];
        case CompletionItemKind.Folder:
          return [_monaco.languages.CompletionItemKind.Folder, undefined];
        case CompletionItemKind.EnumMember:
          return [_monaco.languages.CompletionItemKind.EnumMember, undefined];
        case CompletionItemKind.Constant:
          return [_monaco.languages.CompletionItemKind.Constant, undefined];
        case CompletionItemKind.Struct:
          return [_monaco.languages.CompletionItemKind.Struct, undefined];
        case CompletionItemKind.Event:
          return [_monaco.languages.CompletionItemKind.Event, undefined];
        case CompletionItemKind.Operator:
          return [_monaco.languages.CompletionItemKind.Operator, undefined];
        case CompletionItemKind.TypeParameter:
          return [_monaco.languages.CompletionItemKind.TypeParameter, undefined];
        default:
          return [value - 1, undefined];
      }

    }
    return [CompletionItemKind.Text, value];
  }

  asCompletionInsertText(item: CompletionItem, defaultRange: _monaco.IRange | RangeReplace)
    : { insertText: string, range: _monaco.IRange | RangeReplace, fromEdit: boolean, isSnippet: boolean } {
    const isSnippet = item.insertTextFormat === InsertTextFormat.Snippet;
    if (item.textEdit) {
      const range = this.asRange((item.textEdit as any).range);
      const value = item.textEdit.newText;
      return { isSnippet, insertText: value, range: range as any, fromEdit: true };
    }
    if (item.insertText) {
      return { isSnippet, insertText: item.insertText, fromEdit: false, range: defaultRange };
    }
    return { insertText: item.label, range: defaultRange, fromEdit: false, isSnippet: false };
  }

  asRange(range: null): null;
  asRange(range: RecursivePartial<Range> | undefined | null): _monaco.Range | Partial<_monaco.IRange> | undefined | null {
    if (range === undefined) {
      return undefined;
    }
    if (range === null) {
      return null;
    }
    const start = this.asPosition((range as any).start) as any;
    const end = this.asPosition((range as any).end) as any;
    if (start as any instanceof _monaco.Position && end as any instanceof _monaco.Position) {
      return new _monaco.Range((start as any).lineNumber, (start as any).column, (end as any).lineNumber, (end as any).column);
    }
    const startLineNumber = !start || start.lineNumber === undefined ? undefined : start.lineNumber;
    const startColumn = !start || start.column === undefined ? undefined : start.column;
    const endLineNumber = !end || end.lineNumber === undefined ? undefined : end.lineNumber;
    const endColumn = !end || end.column === undefined ? undefined : end.column;
    return { startLineNumber, startColumn, endLineNumber, endColumn };
  }

  asPosition(position: null): null;
  asPosition(position: Partial<Position> | undefined | null): _monaco.Position | Partial<_monaco.IPosition> | undefined | null {
    if (position === undefined) {
      return undefined;
    }
    if (position === null) {
      return null;
    }
    const { line, character } = position;
    const lineNumber = line === undefined ? undefined : line + 1;
    const column = character === undefined ? undefined : character + 1;
    if (lineNumber !== undefined && column !== undefined) {
      return new _monaco.Position(lineNumber, column);
    }
    return { lineNumber, column };
  }

  asColorInformations(items: ColorInformation[]): _monaco.languages.IColorInformation[] {
    return items.map(item => this.asColorInformation(item));
  }

  asColorInformation(item: ColorInformation): _monaco.languages.IColorInformation {
    return {
      range: this.asRange((item as any).range) as any,
      color: item.color,
    };
  }

  asColorPresentations(items: ColorPresentation[]): _monaco.languages.IColorPresentation[] {
    return items.map(item => this.asColorPresentation(item));
  }

  asColorPresentation(item: ColorPresentation): _monaco.languages.IColorPresentation {
    return {
      label: item.label,
      textEdit: this.asTextEdit(item.textEdit),
      additionalTextEdits: this.asTextEdits((item as any).additionalTextEdits),
    };
  }

}
