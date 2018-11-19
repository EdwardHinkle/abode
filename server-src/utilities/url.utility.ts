export class UrlUtility {
    static getCleanDomain(url: string): string {
        console.log('begin cleaning domain');
        console.log(url);
        url = url.replace('https://', '');
        url = url.replace('http://', '');
        url = url.replace('.json', '');
        url = url.replace(/\//g, '-');
        url = url.replace(/\?/g, '-');
        url = url.replace(/-$/, '');
        console.log(url);
        return url;
    }
}