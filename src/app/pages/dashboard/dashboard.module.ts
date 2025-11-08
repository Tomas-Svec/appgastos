import { NgModule } from '@angular/core';
import { DashboardPageRoutingModule } from './dashboard-routing.module';
import { DashboardPage } from './dashboard.page';

@NgModule({
  imports: [
    DashboardPageRoutingModule,
    DashboardPage
  ]
})
export class DashboardPageModule {}
