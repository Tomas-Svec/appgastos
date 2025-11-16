import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-content',
  templateUrl: './page-content.component.html',
  styleUrls: ['./page-content.component.scss'],
  standalone: false
})
export class PageContentComponent {
  @Input() fullscreen: boolean = true;
  @Input() noPadding: boolean = false;
  @Input() customClass: string = '';
}
