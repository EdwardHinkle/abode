import * as Promise from 'bluebird';
import * as childProcess from 'child_process';

export function runJekyllBuild(): Promise<any> {
    return new Promise((resolve, reject) => {
    
        childProcess.exec('cd ' + __dirname + '; cd ../../jekyll/; jekyll build', (error, stdout, stderr, res) => {
            if (error) {
                reject(error);
            }
            console.log(stdout);
            resolve();
        });

    });
}

export function runJekyllPrivateBuild(): Promise<any> {
    return new Promise((resolve, reject) => {
    
        childProcess.exec('cd ' + __dirname + '; cd ../../jekyll/; jekyll build --config=_private_config.yml', (error, stdout, stderr, res) => {
            if (error) {
                reject(error);
            }
            console.log(stdout);
            resolve();
        });

    });
}

export function runJekyllDraftBuild(): Promise<any> {
    return new Promise((resolve, reject) => {
    
        childProcess.exec('cd ' + __dirname + '; cd ../../jekyll/; jekyll build --drafts --config=_config.yml,_local_config.yml', (error, stdout, stderr, res) => {
            if (error) {
                reject(error);
            }
            console.log(stdout);
            resolve();
        });

    });
}