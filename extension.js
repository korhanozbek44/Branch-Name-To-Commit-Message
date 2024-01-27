const vscode = require('vscode');
const changeCase = require('case-anything');

const isExtensionInstalled = (extensionName) => {
    const extension = vscode.extensions.getExtension(extensionName);
    return !!extension;
};


function activate(context) {
    const callback = (tryCount) => {
        try {
            const configuration = vscode.workspace.getConfiguration('branch-name-to-commit-message');
            const branchNameResolverRegexText = configuration.get('branchNameResolverRegex');
            const commitMessageConvention = configuration.get('commitMessageConvention');

            const gitExt = vscode.extensions.getExtension('vscode.git');
			if (!isExtensionInstalled('vscode.git') || !gitExt) {
				vscode.window.showErrorMessage('Git extension is not installed');
				return;
			}
			const gitExtension = gitExt.exports;
            const git = gitExtension.getAPI(1);
			if (git.repositories.length === 0) {
				vscode.window.showErrorMessage('Git repository not found');
				return;
			}
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

            let commitMessage = commitMessageConvention;

			const changeCaseCommitConventionParser = /{{{(\d+)}}}/g;
            let matchChangeCase;
            while ((matchChangeCase = changeCaseCommitConventionParser.exec(commitMessage)) !== null) {
				const relatedText = brachNameMatchArray[parseInt(matchChangeCase[1]) + 1];
                commitMessage = commitMessage.replace(matchChangeCase[0], changeCase.spaceCase(relatedText, {keepSpecialCharacters: false}));
                changeCaseCommitConventionParser.lastIndex = matchChangeCase.index + 1;
            }

			const commitConventionParser = /{{(\d+)}}/g;
            let match;
            while ((match = commitConventionParser.exec(commitMessage)) !== null) {
                commitMessage = commitMessage.replace(match[0], brachNameMatchArray[parseInt(match[1]) + 1]);
                commitConventionParser.lastIndex = match.index + 1;
            }

			repository.inputBox.value = commitMessage;
            vscode.window.showInformationMessage('DONE. Commit message generated.');
        } catch (err) {
            console.log(err);
        }
    };
    const panelButtonDisposable = vscode.commands.registerCommand('branch-name-to-commit-message.fill-commit-box', callback);

    context.subscriptions.push(panelButtonDisposable);
}
function deactivate() {}

module.exports = {
    activate,
    deactivate,
};
