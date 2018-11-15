import * as requestPromise from "request-promise";
import * as fs from 'fs';
import * as path from 'path';
import { WeatherController } from "./weather.controller";
var config = require('../../abodeConfig.json');
var storagePath = path.join(__dirname, '../../_storage/');

export class LocationController {
    
    static getCachedLocation(): Promise<any> {
        return new Promise((resolve, reject) => {
            let weatherFile = fs.readFileSync(path.join(storagePath, 'currentWeather.json'));
            try {
                let weatherData = JSON.parse(weatherFile);
                resolve(weatherData);
            } catch(error) {
                console.log('error parsing weather file');
                console.log(error);
                reject(error);
            }
        });
    }
    
    static cacheCurrentLocation() {
        this.getCurrentLocation().then(location => {
            return WeatherController.getCurrentWeather(location).then(weather => {
                return {
                    location: location,
                    weather: weather
                }
            });
        }).then(info => {
            fs.writeFile(path.join(storagePath, 'currentWeather.json'), JSON.stringify(info), (err) => {
                if(err) {
                    return console.log(err);
                }
            });
        });
    }
    
    static getCurrentLocation(): Promise<any> {
        return requestPromise.get(`${config.compass.url}api/last?token=${config.compass.token.read}`, {
            json: true
        }).then(tripData => {
            return tripData.data;
        });
    }
    
}