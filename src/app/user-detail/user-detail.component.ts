import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { User } from '../Interfaces/user.model';
import AOS from 'aos';
@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, NgbAlertModule ],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.css'
})
export class UserDetailComponent implements OnInit { 
  users: User | undefined;
  images: string[] = [

  ]
  
  constructor(
    private httpClient: HttpClient,
    private activatedRoute: ActivatedRoute){}


  ngOnInit(): void {
    AOS.init();
    window.scrollTo(0, 0); 

    this.activatedRoute.params.subscribe(params => {
      const id = params['id'];

      if (!id) return;


    const url = 'https://gore-metabolism-engine-effects.trycloudflare.com/user/' + id;

    this.httpClient.get<User>(url).subscribe(b => this.users = b);
    })
  }

  

}