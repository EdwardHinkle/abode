import { Category } from './category.model';

export class Categories {
    
    public static getAll(logSql: boolean = false): Promise<Category[]> {
        let categories: Category[] = [];
        // Select the post ids we need to fetch the actual file
        let sql = `SELECT name, COUNT(posts_tags.tag_name) as tagCount FROM tags JOIN posts_tags ON tags.name = posts_tags.tag_name GROUP BY posts_tags.tag_name ORDER BY tagCount DESC`;

        if (logSql) {
            console.log('searching sql');
            console.log(sql);
        }

        return new Promise((resolve, reject) => {
            DataController.db.serialize(() => {
                DataController.db.each(sql,
                    (error, row) => {
                        if (error) {
                            console.log('ERROR!');
                            console.log(error);
                        }

                        categories.push(new Category(row.name));
                    }, (error, count) => {
                        resolve(categories);
                    });
            });
        });
    }

    
    public static search(searchInfo: SearchCategoryInfo, logSql: boolean = false): Promise<Category[]> {
        let categories: Category[] = [];
        // Select the post ids we need to fetch the actual file
        let sql = `SELECT name, COUNT(posts_tags.tag_name) as tagCount FROM tags JOIN posts_tags ON tags.name = posts_tags.tag_name WHERE tags.name LIKE "%${searchInfo.tag_name}%" GROUP BY posts_tags.tag_name ORDER BY tagCount DESC`;

        if (logSql) {
            console.log('searching sql');
            console.log(sql);
        }

        return new Promise((resolve, reject) => {
            DataController.db.serialize(() => {
                DataController.db.each(sql,
                    (error, row) => {
                        if (error) {
                            console.log('ERROR!');
                            console.log(error);
                        }

                        categories.push(new Category(row.name));
                    }, (error, count) => {
                        resolve(categories);
                    });
            });
        });
    }

    
}

export interface SearchCategoryInfo {
    tag_name: string;
}