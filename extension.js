const vscode = require('vscode');

const isExtensionInstalled = (extensionName) => {
    const extension = vscode.extensions.getExtension(extensionName);
    return !!extension;
};

function activate(context) {
    console.log('Congratulations, your extension "branch-name-to-commit-message" is now active!');

    const callback = (tryCount) => {
        if (!isExtensionInstalled('vscode.git')) {
            vscode.window.showErrorMessage('Git extension is not installed');
        }
        try {
            const configuration = vscode.workspace.getConfiguration('branch-name-to-commit-message');
            const branchNameResolverRegexText = configuration.get('branchNameResolverRegex');
            const commitMessageConvention = configuration.get('commitMessageConvention');

            const gitExtension = vscode.extensions.getExtension('vscode.git').exports;
            const git = gitExtension.getAPI(1);
            const repository = git.repositories[0];
            if (!repository.state.HEAD) {
                if (tryCount === 2) {
                    vscode.window.showInformationMessage("Repository's HEAD didn't found");
                } else {
                    setTimeout(() => callback(2), 1000);
                }
                return;
            }
            const currentBranchName = repository.state.HEAD.name;

            const branchNameResolverRegex = new RegExp(branchNameResolverRegexText);
            const brachNameMatchArray = branchNameResolverRegex.exec(currentBranchName);

            const commitConventionParser = /{{(\d+)}}/g;
            let commitMessage = commitMessageConvention;

            let match;
            while ((match = commitConventionParser.exec(commitMessage)) !== null) {
                commitMessage = commitMessage.replace(match[0], brachNameMatchArray[parseInt(match[1]) + 1]);
                commitConventionParser.lastIndex = match.index + 1;
            }

            vscode.window.showInformationMessage(commitMessage);
        } catch (err) {
            console.log(err);
        }
    };
    let panelButtonDisposable = vscode.commands.registerCommand('branch-name-to-commit-message.fill-commit-box', callback);

    context.subscriptions.push(panelButtonDisposable);
}
function deactivate() {}

module.exports = {
    activate,
    deactivate,
};
