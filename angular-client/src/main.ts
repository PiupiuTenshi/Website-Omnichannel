import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig).catch((error: unknown) => {
  console.error(error);
  document.querySelector('app-root')!.innerHTML = '<main class="startup-error"><h1>Không thể khởi động ứng dụng</h1><p>Hãy mở Developer Tools để xem lỗi chi tiết, sau đó tải lại trang.</p></main>';
});
