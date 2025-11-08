import { NgModule } from '@angular/core';
import { LoginPageRoutingModule } from './login-routing.module';
import { LoginPage } from './login.page';

@NgModule({
  imports: [
    LoginPageRoutingModule,
    LoginPage
  ]
})
export class LoginPageModule {}
