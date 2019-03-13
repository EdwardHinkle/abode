export class UrlUtility {

    static urlExpression = "(https?):\\/\\/?([www\\.]?[-a-zA-Z0-9@:%._\\+~#=]{2,256}\\.[a-z]{2,6}\\b:?[0-9]{0,4}\\/?)([-a-zA-Z0-9@:%_\\+.~#&//=]*)([-a-zA-Z0-9@:%_\\+.~#?&//=]*)";

    static getUrlSegments(url: string): UrlSegments {
        let regex = new RegExp(UrlUtility.urlExpression);
        let matches = regex.exec(url);

        return {
            protocol: matches[1] as UrlProtocol,
            hostname: matches[2],
            path: matches[3],
            query: matches[4]
        };
    }

    static getDomainFromUrl(url: string): string {
        let urlSegments = UrlUtility.getUrlSegments(url);
        return `${urlSegments.protocol}://${urlSegments.hostname}`;
    }

    static getCleanDomain(url: string): string {
        url = this.getDomainFromUrl(url);
        url = url.replace('https://', '');
        url = url.replace('http://', '');
        url = url.replace('.json', '');
        url = url.replace(/\//g, '-');
        url = url.replace(/\?/g, '-');
        url = url.replace(/-$/, '');
        return url;
    }

    static getCleanUrl(url: string): string {
        url = url.replace('https://', '');
        url = url.replace('http://', '');
        url = url.replace('.json', '');
        url = url.replace(/\//g, '-');
        url = url.replace(/\?/g, '-');
        url = url.replace(/-$/, '');
        return url;
    }
}

export interface UrlSegments {
    protocol: UrlProtocol;
    hostname: string;
    path: string;
    query: string;
}

export type UrlProtocol = 'http' | 'https';