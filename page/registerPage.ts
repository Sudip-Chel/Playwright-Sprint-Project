import { Page, expect } from '@playwright/test';
import { Logger } from '../utils/logger';
import { RegisterLocators } from '../locators/registerLocator';

export interface RegistrationData {
  firstName?: string;
  lastName?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phoneNumber?: string;
  ssn?: string;
  username: string;
  password: string;
}

export class RegisterPage {
  constructor(public readonly page: Page) {}

  async navigate(): Promise<void> {
    Logger.info('RegisterPage: Navigating to /parabank/register.htm');
    await this.page.goto('/parabank/register.htm');
  }

  // Fills out the registration form.
  async registerDynamicUser(data: RegistrationData): Promise<void> {
    const filled: Required<RegistrationData> = {
      firstName: data.firstName ?? 'Sudip',
      lastName: data.lastName ?? 'Chel',
      street: data.street ?? 'Haldia Street 123',
      city: data.city ?? 'Haldia',
      state: data.state ?? 'West Bengal',
      zipCode: data.zipCode ?? '722140',
      phoneNumber: data.phoneNumber ?? '9876543210',
      ssn: data.ssn ?? `SSN-12345789`,
      username: data.username,
      password: data.password
    };

    Logger.info(`RegisterPage: Submitting registration for username=${filled.username}`);

  
    await this.page.locator(RegisterLocators.firstNameInput).fill(filled.firstName);
    await this.page.locator(RegisterLocators.lastNameInput).fill(filled.lastName);
    await this.page.locator(RegisterLocators.addressInput).fill(filled.street);
    await this.page.locator(RegisterLocators.cityInput).fill(filled.city);
    await this.page.locator(RegisterLocators.stateInput).fill(filled.state);
    await this.page.locator(RegisterLocators.zipCodeInput).fill(filled.zipCode);
    await this.page.locator(RegisterLocators.phoneNumberInput).fill(filled.phoneNumber);
    await this.page.locator(RegisterLocators.ssnInput).fill(filled.ssn);
    await this.page.locator(RegisterLocators.usernameInput).fill(filled.username);

    await this.page.locator(RegisterLocators.passwordInput).fill(filled.password);
    await this.page.locator(RegisterLocators.confirmPasswordInput).fill(filled.password);

    await this.page.getByRole('button', { name: 'Register' }).click();
  }

  async verifyRegistrationSuccess(): Promise<void> {
    await expect(this.page.locator('.title'), 'Registration should land on Welcome page')
      .toContainText(/welcome/i, { timeout: 15000 });
    Logger.info('RegisterPage: Registration successful (Welcome page detected)');
  }
}