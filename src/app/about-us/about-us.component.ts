import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import Aos from 'aos';


@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [NgbAccordionModule],
  templateUrl: './about-us.component.html',
  styleUrl: './about-us.component.css'
})
export class AboutUsComponent implements OnInit {


  showSpinner = true;
  @ViewChild('skills') skillsElement!: ElementRef;

  constructor() { }

  ngOnInit(): void {
    Aos.init({
      duration: 1000,
      easing: 'ease-out',
      once: true 
    });
    window.scrollTo(0, 0); 

    setTimeout(() => {
    this.showSpinner = false;
    
  },2000);

  }

}