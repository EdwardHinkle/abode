

export class Category {
    
    private _value: string;
    
    constructor(value: string) {
        this._value = value;
    }
    
    toString(): string {
        return this._value;
    }

    toJSON(): any {
        return this.toString();
    }
    
}