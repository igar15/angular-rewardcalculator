import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { User } from '../common/user';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Roles } from '../enums/roles.enum';
import { Department } from '../common/department';
import { SharedDataService } from './shared-data.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  private host = environment.apiUrl;
  private token: string;
  private loggedInUserEmail: string;
  private jwtHelper = new JwtHelperService();

  constructor(private httpClient: HttpClient, private sharedDataService: SharedDataService) { }

  login(email: string, password: string): Observable<HttpResponse<User>> {
    const authQueryParams = `?email=${email}&password=${password}`;
    return this.httpClient.post<User>(`${this.host}/profile/login${authQueryParams}`, {}, {observe: 'response'});
  }

  logout(): void {
    this.token = null;
    this.loggedInUserEmail = null;
    localStorage.removeItem('rewardcalculator-user');
    localStorage.removeItem('rewardcalculator-token');
    this.sharedDataService.changeSelectedDepartment(null);
  }

  saveToken(token: string): void {
    this.token = token;
    localStorage.setItem('rewardcalculator-token', token);
  }

  addUserToLocalCache(user: User): void {
    localStorage.setItem('rewardcalculator-user', JSON.stringify(user));
  }

  getUserFromLocalCache(): User {
    return JSON.parse(localStorage.getItem('rewardcalculator-user'));
  }

  loadToken(): void {
    this.token = localStorage.getItem('rewardcalculator-token');
  }

  getToken(): string {
    return this.token;
  }

  isLoggedIn(): boolean {
    this.loadToken();
    if (this.token != null && this.token !== '') {
      if (this.jwtHelper.decodeToken(this.token).sub != null || '') {
        if (!this.jwtHelper.isTokenExpired(this.token)) {
          this.loggedInUserEmail = this.jwtHelper.decodeToken(this.token).sub;
          return true;
        }
      }
      return false;
    } else {
      this.logout();
      return false;
    }
  }

  isAdmin(): boolean {
    if (this.isLoggedIn()) {
      return this.getUserFromLocalCache().roles.includes(Roles.ADMIN);
    } else {
      return false;
    }
  }

  isPersonnelOfficer(): boolean {
    if (this.isLoggedIn()) {
      return this.getUserFromLocalCache().roles.includes(Roles.PERSONNEL_OFFICER);
    } else {
      return false;
    }
  }

  isEconomist(): boolean {
    if (this.isLoggedIn()) {
      return this.getUserFromLocalCache().roles.includes(Roles.ECONOMIST);
    } else {
      return false;
    }
  }

  isDepartmentHead(): boolean {
    if (this.isLoggedIn()) {
      return this.getUserFromLocalCache().roles.includes(Roles.DEPARTMENT_HEAD);
    } else {
      return false;
    }
  }

  isDepartmentHeadOnly(): boolean {
    if (this.isLoggedIn()) {
      return (this.getUserFromLocalCache().roles.length == 1 && this.getUserFromLocalCache().roles.includes(Roles.DEPARTMENT_HEAD));
    } else {
      return false;
    }
  }

  getManagedDepartments(): Department[] {
    return this.getUserFromLocalCache().managedDepartments.sort((d1, d2) => d1.name.localeCompare(d2.name));
  }
}