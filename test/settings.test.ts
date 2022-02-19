import { assert } from 'console';
import path from 'path';
import { Settings } from '../lib';

test('Setter for `workspace_dir` works', () => {
    let defaultEntry = Settings.ENTRY;
    console.debug(`Entry before: ${defaultEntry}`);

    Settings.workspace_dir = 'my_workspace_dir';

    let newEntry = Settings.ENTRY;
    console.debug(`Entry after: ${newEntry}`);

    assert(path.join(defaultEntry, 'my_workspace_dir') == newEntry);
});
