import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { Store } from '@ngxs/store';
import {
  HideLoaderAction,
  ShowLoaderAction,
  ShowButtonSpinnerAction,
  HideButtonSpinnerAction,
} from '../../shared/action/loader.action';
import { finalize, tap } from 'rxjs/operators';

@Injectable()
export class LoaderInterceptor implements HttpInterceptor {
  constructor(private store: Store) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Dispatch the action to show the loader
    this.store.dispatch(new ShowLoaderAction());

    return next.handle(req).pipe(
      tap({
        error: (err) => {
          // On error, dispatch the action to hide the loader
          this.store.dispatch(new HideLoaderAction());
          this.store.dispatch(new HideButtonSpinnerAction());
        },
      }),
      finalize(() => {
        // Dispatch the action to hide the loader
        this.store.dispatch(new HideLoaderAction());
        this.store.dispatch(new HideButtonSpinnerAction());
      })
    );
  }
}
