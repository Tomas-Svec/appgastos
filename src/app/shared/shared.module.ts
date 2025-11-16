import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { PageContentComponent } from './components/page-content/page-content.component';

@NgModule({
  declarations: [
    PageContentComponent
  ],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [
    PageContentComponent
  ]
})
export class SharedModule { }
