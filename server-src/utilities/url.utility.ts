export class UrlUtility {
    static getCleanDomain(url: string): string {
        url = url.replace('https://', '');
        url = url.replace('http://', '');
        url = url.replace('.json', '');
        url = url.replace(/\//g, '-');
        url = url.replace(/\?/g, '-');
        url = url.replace(/-$/, '');
        return url;
    }
}