import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-add-income',
  templateUrl: './add-income.component.html',
  styleUrls: ['./add-income.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AddIncomeComponent implements OnInit {
  monthlyIncome: number = 0;

  constructor(private modalController: ModalController) { }

  ngOnInit() {}

  dismiss() {
    this.modalController.dismiss();
  }

  saveIncome() {
    if (this.monthlyIncome <= 0) {
      console.log('Por favor ingresa un monto válido');
      return;
    }

    this.modalController.dismiss({
      amount: this.monthlyIncome
    });
  }
}
