import * as Promise from 'bluebird';
import * as childProcess from 'child_process';
import * as moment from 'moment';

export function runGitPull(): Promise<any> {
    return new Promise((resolve, reject) => {
    
        childProcess.exec('cd ' + __dirname + '/../../jekyll/_source/; git pull --rebase origin master', (error, stdout) => {
            if (error) {
                reject(error);
            }
            console.log(stdout);
            resolve();
        });

    });
}

export function runGitStageAll(): Promise<any> {
    return new Promise((resolve, reject) => {
    
        childProcess.exec('cd ' + __dirname + '/../../jekyll/_source/; git add .', (error, stdout) => {
            if (error) {
                console.log("Stage All Error with git");
                reject(error);
            }
            console.log(stdout);
            resolve();
        });

    });
}

export function runGitCommit(): Promise<any> {
    return new Promise((resolve, reject) => {
    
        childProcess.exec('cd ' + __dirname + '/../../jekyll/_source/; git commit -m "abode auto-commit ' + moment().format("MMM D, YYYY h:mm a") + '"', (error, stdout) => {
            if (error) {
                console.log("Git Commit Error");
                console.log(JSON.stringify(error, null, 2));
                // reject(error);
            }
            console.log(stdout);
            resolve();
        });

    });
}

export function runGitPush(): Promise<any> {
    return new Promise((resolve, reject) => {
    
        childProcess.exec('cd ' + __dirname + '/../../jekyll/_source/; git push', (error, stdout) => {
            if (error) {
                reject(error);
            }
            console.log(stdout);
            resolve();
        });

    });
}