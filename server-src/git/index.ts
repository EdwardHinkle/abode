import * as Promise from 'bluebird';
import * as childProcess from 'child_process';

export function runGitPull(): Promise<any> {
    return new Promise((resolve, reject) => {
    
        childProcess.exec('cd ' + __dirname + '; cd ../../; git status', (error, stdout, stderr, res) => {
            if (error) {
                reject(error);
            }
            console.log(stdout);
            resolve();
        });

    });
}