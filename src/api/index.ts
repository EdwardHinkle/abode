import * as express from 'express';

// import sub-routers
import { micropubRouter } from './micropub';
import { webmentionRouter } from './webmentions';
import { dataRouter } from './dataController';
import { siteRouter } from './siteController';

export let apiRouter = express.Router();

apiRouter.use('/micropub', micropubRouter);
apiRouter.use('/webmention', webmentionRouter);
apiRouter.use('/api', dataRouter);
apiRouter.use('', siteRouter);

