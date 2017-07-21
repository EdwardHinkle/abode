import * as configTools from './index';

configTools.importPeopleData().then(() => {
    console.log("Done Importing");
});