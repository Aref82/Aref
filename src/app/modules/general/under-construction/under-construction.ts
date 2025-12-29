import { Component } from '@angular/core';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {RouterLink} from '@angular/router';
import {NzButtonComponent} from 'ng-zorro-antd/button';

@Component({
  standalone: true,
  selector: 'app-under-construction',
  templateUrl: './under-construction.html',
  styleUrl: './under-construction.scss',
  imports: [
    NzIconDirective,
    RouterLink,
    NzButtonComponent
  ]
})
export class UnderConstruction {

}
