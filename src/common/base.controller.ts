import 'reflect-metadata';
import { Response, Router } from 'express';
import { injectable } from 'inversify';
import { ExpressReturnType, IControllerRoute } from './route.interface';

@injectable()
export abstract class BaseController {
	private readonly _router: Router;

	constructor() {
		this._router = Router();
	}

	get router(): Router {
		return this._router;
	}

	send<T>(res: Response, code: number, message: T): ExpressReturnType {
		res.type('application/json');
		return res.status(code).json(message);
	}

	protected bindRoutes(routes: IControllerRoute[]): void {
		for (const route of routes) {
			const routeMiddlewares = route.middlewares?.map((m) => m.execute.bind(m));
			const handler = route.func.bind(this);
			const pipeline = routeMiddlewares ? [...routeMiddlewares, handler] : handler;
			this.router[route.method](route.path, pipeline);
		}
	}
}
