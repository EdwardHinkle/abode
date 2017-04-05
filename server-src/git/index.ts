import * as Promise from 'bluebird';
import * as childProcess from 'child_process';
import * as moment from 'moment';

export function runGitPull(): Promise<any> {
    return new Promise((resolve, reject) => {
    
        childProcess.exec('cd ' + __dirname + '; cd ../../; git pull', (error, stdout, stderr, res) => {
            if (error) {
                reject(error);
            }
            console.log(stdout);
            resolve();
        });

    });
}

export function runGitCommit(): Promise<any> {
    return new Promise((resolve, reject) => {
    
        childProcess.exec('cd ' + __dirname + '; cd ../../; git add .; git commit -m "abode auto-commit ' + moment().format("MMM D, YYYY h:mm a") + '"', (error, stdout, stderr, res) => {
            if (error) {
                reject(error);
            }
            console.log(stdout);
            resolve();
        });

    });
}

export function runGitPush(): Promise<any> {
    return new Promise((resolve, reject) => {
    
        childProcess.exec('cd ' + __dirname + '; cd ../../; git push', (error, stdout, stderr, res) => {
            if (error) {
                reject(error);
            }
            console.log(stdout);
            resolve();
        });

    });
}