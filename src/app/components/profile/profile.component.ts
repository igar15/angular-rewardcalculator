import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/common/user';
import { NotificationType } from 'src/app/enums/notification-type.enum';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { NotificationService } from 'src/app/services/notification.service';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { ProfileService } from 'src/app/services/profile.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { CustomValidators } from 'src/app/validators/custom-validators';
import { TestDataCheckingService } from 'src/app/services/test-data-checking.service';
import { ErrorHandlingService } from 'src/app/services/error-handling.service';
import { Messages } from 'src/app/enums/messages.enum';
import { StringUtil } from 'src/app/utils/string-util';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  profile: User;
  managedDepartmentsNames: string[] = [];

  changePasswordFormGroup: FormGroup;

  constructor(private profileService: ProfileService, private authenticationService: AuthenticationService, 
              private notificationService: NotificationService, private location: Location, private router: Router,
              private formBuilder: FormBuilder, private errorHandlingService: ErrorHandlingService, 
              private testDataCheckingService: TestDataCheckingService) { }

  ngOnInit(): void {
    this.handleUserProfile();
    this.makeChangePasswordFormGroup();
  }

  private handleUserProfile() {
    this.profileService.getProfile().subscribe(
      (response: User) => {
        this.profile = response;
        this.fillManagedDepartmentsNames();
      },
      (errorResponse: HttpErrorResponse) => {
        this.errorHandlingService.handleErrorResponse(errorResponse);
      }
    );
  }

  private fillManagedDepartmentsNames() {
    for (let department of this.profile.managedDepartments) {
      this.managedDepartmentsNames.push(department.name);
    }
    this.managedDepartmentsNames.sort();
  }

  private makeChangePasswordFormGroup() {
    this.changePasswordFormGroup = this.formBuilder.group({
      changedPassword: this.formBuilder.group({
        newPassword: new FormControl('', [Validators.required, Validators.minLength(5), Validators.maxLength(32), CustomValidators.notOnlyWhitespace]),
        repeatNewPassword: new FormControl('', [Validators.required])
      }, { validator: this.checkIfMatchingPasswords('newPassword', 'repeatNewPassword') })
    });
  }

  prepareChangePasswordFormGroup() {
    this.changePasswordFormGroup = this.formBuilder.group({
      changedPassword: this.formBuilder.group({
        newPassword: new FormControl('', [Validators.required, Validators.minLength(5), Validators.maxLength(32), CustomValidators.notOnlyWhitespace]),
        repeatNewPassword: new FormControl('', [Validators.required])
      }, { validator: this.checkIfMatchingPasswords('newPassword', 'repeatNewPassword') })
    });
  }

  private checkIfMatchingPasswords(passwordKey: string, repeatPasswordKey: string) {
    return (group: FormGroup) => {
      let passwordInput = group.controls[passwordKey];
      let repeatPasswordInput = group.controls[repeatPasswordKey];
      if (!repeatPasswordInput.value) {
        return repeatPasswordInput.setErrors({ required: true });
      }
      if (passwordInput.value !== repeatPasswordInput.value) {
        return repeatPasswordInput.setErrors({ notEquivalent: true });
      }
      else {
        return repeatPasswordInput.setErrors(null);
      }
    }
  }

  onChangePassword(): void {
    if (this.changePasswordFormGroup.invalid) {
      this.changePasswordFormGroup.markAllAsTouched();
    } else {
      if (!this.testDataCheckingService.checkTestUser(+this.profile.id, Messages.TEST_DATA_CANNOT_BE_CHANGED)) {
        let newPassword = this.changePasswordFormGroup.get('changedPassword.newPassword').value;
        this.profileService.changePassword(newPassword).subscribe(
          response => {
            document.getElementById("change-password-modal-close").click();
            this.notificationService.sendNotification(NotificationType.SUCCESS, Messages.PASSWORD_CHANGED);
          },
          (errorResponse: HttpErrorResponse) => {
            this.errorHandlingService.handleErrorResponseWithButtonClick(errorResponse, "change-password-modal-close");
          }
        );
      }
    }
  }

  logOut(): void {
    this.authenticationService.logout();
    this.notificationService.sendNotification(NotificationType.SUCCESS, Messages.LOGGED_OUT);
    this.router.navigateByUrl("/login");
  }

  back(): void {
    this.location.back()
  }

  isAdmin(): boolean {
    return this.authenticationService.isAdmin();
  }

  isAdminOrDepartmentHead(): boolean {
    return (this.authenticationService.isAdmin() || this.authenticationService.isDepartmentHead());
  }

  isDepartmentHeadAndNotAdmin(): boolean {
    return (this.authenticationService.isDepartmentHead() && !this.authenticationService.isAdmin());
  }

  prepareRolesForShowing(roles: string[]): string {
    if (roles != null) {
      let preparedRoles = [];
      for (let role of roles) {
        role = StringUtil.UpperCaseFirstLettersOfWords(role.replace('_', ' '));
        preparedRoles.push(role);
      }
      return preparedRoles.sort().join(', ');  
    }
    return '';
  }

  // Getters for changePasswordFormGroup values
  get newPassword() {
    return this.changePasswordFormGroup.get('changedPassword.newPassword');
  }
  get repeatNewPassword() {
    return this.changePasswordFormGroup.get('changedPassword.repeatNewPassword');
  }
}