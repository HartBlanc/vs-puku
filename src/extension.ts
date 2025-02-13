// The module 'vscode' contains the VS Code extensibility API
import {
  workspace,
  commands,
  TextDocument,
  OutputChannel,
  window,
  Uri,
} from "vscode";
import * as path from "path";
import { exec } from "child_process";

export function activate() {
  var extension = new PleasePukuExtension();
  extension.showOutputMessage();

  workspace.onDidChangeConfiguration(() => {
    extension.showOutputMessage("vs-puku: Reloading config.");
    extension.loadConfig();
  });

  commands.registerCommand("vs-puku.enableOnSave", () => {
    workspace.getConfiguration("vs-puku").update("runOnSave", true, true);
  });
  commands.registerCommand("vs-puku.disableOnSave", () => {
    workspace.getConfiguration("vs-puku").update("runOnSave", false, true);
  });

  workspace.onDidSaveTextDocument((document: TextDocument) => {
    // The code you place here will be executed every time a file is saved.
    extension.onSaveFile(document);
  });
}

export function deactivate() {}

interface PukuConfig {
  runOnSave: boolean;
  autoClearConsole: boolean;
  shell: string;
  pukuCommand: string;
}

class PleasePukuExtension {
  private _outputChannel: OutputChannel;
  private _config: PukuConfig;
  private _debounce_log: {[key:string]: TextDocument};

  constructor() {
    this._outputChannel = window.createOutputChannel("vs-puku");
    this._config = this.loadConfig();
    this._debounce_log = {};
  }

  public loadConfig(): PukuConfig {
    let config = <PukuConfig>{};
    config.autoClearConsole = workspace
      .getConfiguration("vs-puku")
      .get("autoClearConsole", true);
    config.runOnSave = workspace
      .getConfiguration("vs-puku")
      .get("runOnSave", true);
    config.shell = workspace
      .getConfiguration("vs-puku")
      .get("shell", "bash");
    config.pukuCommand = workspace
      .getConfiguration("vs-puku")
      .get("pukuCommand", "plz puku");
    this._config = config;
    return config;
  }

  public get isEnabled(): boolean {
    return this._config.runOnSave;
  }
  public get shell(): string {
    return this._config.shell;
  }
  public get pukuCommand(): string {
    return this._config.pukuCommand;
  }
  public get autoClearConsole(): boolean {
    return this._config.autoClearConsole;
  }

  /**
   * Show message in output channel
   */
  public showOutputMessage(message?: string): void {
    message =
      message || `vs-puku ${this.isEnabled ? "enabled" : "disabled"}.`;
    this._outputChannel.appendLine(message);
  }

  public onSaveFile(document: TextDocument): void {
    if (this.autoClearConsole) {
      this._outputChannel.clear();
    }

    if (!this.isEnabled) {
      this.showOutputMessage();
      return;
    }

    switch (document.languageId) {
      case "go": {
        // If it's a go file, we run the puku build file completer.
        this.runPukuCmd(document);
        return;
      }
      default: {
        this._outputChannel.appendLine(
          `vs-puku does not currently support ${document.languageId} files.`
        );
        return;
      }
    }
  }

  public runPukuCmd(document: TextDocument): void {
    this._outputChannel.appendLine("Saved GO file: " + document.fileName);
    let k = path.dirname(document.fileName);
    if (k in this._debounce_log) {
        // debounce duplicate concurrent requests for the same package
        return
    }
    this._debounce_log[k] = document

    const cmd = `${this.pukuCommand} fmt ${document.fileName}`;
    this.showOutputMessage(`*** cmd '${cmd}' start.`);
    var child = exec(cmd, this._getExecOption(document));

    child.stdout!.on("data", (data) => this._outputChannel.append(data));
    child.stderr!.on("data", (data) => this._outputChannel.append(data));

    child.on("error", (e) => {
      this.showOutputMessage(e.message);
      delete this._debounce_log[path.dirname(document.fileName)];
    });

    child.on("exit", (e) => {
      if (e != 0) {
        this.showOutputMessage(`*** cmd '${cmd}' exited with status: ${e}.`);
      } else {
        this.showOutputMessage(`*** cmd '${cmd}' successful.`);
      }
      delete this._debounce_log[path.dirname(document.fileName)];
    });
  }

  private _getWorkspaceFolderPath(uri: Uri): string {
    const workspaceFolder = workspace.getWorkspaceFolder(uri);

    return workspaceFolder ? workspaceFolder.uri.fsPath : "";
  }

  private _getExecOption(
    document: TextDocument
  ): { shell: string; cwd: string } {
    return {
      shell: this.shell,
      cwd: this._getWorkspaceFolderPath(document.uri),
    };
  }
}
