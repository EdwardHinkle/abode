import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import * as mf2 from '../api/mf2';
import { IPost } from '../api/dataController';

const config = require('../../abodeConfig.json');

@Injectable()
export class DataService {

  constructor(private _http: Http) { }

  getPosts(settings: IGetPostSettings): Observable<IPost[]> {
    const queryArray = [];

    if (settings.limit !== undefined) {
      queryArray.push(`count=${settings.limit}`);
    }

    if (settings.types !== undefined) {
      if (settings.types !== 'all') {
        queryArray.push(`types=${settings.types.join(',')}`);
      }
    }

    return this._http
        .get(`${config.server}/api/posts/latest?${queryArray.join('&')}`)
        .map((response: Response) => <IPost[]> response.json());
  }

  getPostById(year: number, month: number, day: number, postIndex: number) {
    return this._http
        .get(`${config.server}/api/${year}/${month}/${day}/${postIndex}`)
        .map((response: Response) => <IPost[]> response.json());
  }

}

interface IGetPostSettings {
  limit?: number;
  types: mf2.postType[] | 'all';
}
