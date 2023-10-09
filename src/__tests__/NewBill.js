/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from '@testing-library/dom';
import NewBillUI from '../views/NewBillUI.js';
import NewBill from '../containers/NewBill.js';
import { ROUTES, ROUTES_PATH } from '../constants/routes';
import { localStorageMock } from '../__mocks__/localStorage.js';
import mockStore from '../__mocks__/store';
import router from '../app/Router';

jest.mock('../app/store', () => mockStore);

// describe("Given ...", () => {
//   describe("When ...", () => {
//     test("Then ...", async () => {

//     })
//   })
// })

describe('Given I am connected as an employee', () => {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });
  window.localStorage.setItem(
    'user',
    JSON.stringify({
      type: 'Employee',
    })
  );
  const root = document.createElement('div');
  root.setAttribute('id', 'root');
  document.body.append(root);
  router();

  describe('When I am on NewBill Page', () => {
    test('Then mail icon in vertical layout should be highlighted', async () => {
      window.onNavigate(ROUTES_PATH.NewBill);

      await waitFor(() => screen.getByTestId('icon-mail'));
      const mailIcon = screen.getByTestId('icon-mail');
      expect(mailIcon.className).toBe('active-icon');
    });
  });

  describe('when I submit the form with empty fields', () => {
    test('then I should stay on new Bill page', () => {
      window.onNavigate(ROUTES_PATH.NewBill);
      const newBill = new NewBill({
        document,
        onNavigate,
        mockStore,
        localStorage: window.localStorage,
      });

      expect(screen.getByTestId('expense-name').value).toBe('');
      expect(screen.getByTestId('datepicker').value).toBe('');
      expect(screen.getByTestId('amount').value).toBe('');
      expect(screen.getByTestId('vat').value).toBe('');
      expect(screen.getByTestId('pct').value).toBe('');
      expect(screen.getByTestId('file').value).toBe('');

      const form = screen.getByTestId('form-new-bill');
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));

      form.addEventListener('submit', handleSubmit);
      fireEvent.submit(form);
      expect(handleSubmit).toHaveBeenCalled();
      expect(form).toBeTruthy();
    });
  });

  describe('when I upload a file with the wrong format', () => {
    test('then it should return an error message', async () => {
      document.body.innerHTML = NewBillUI();
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const newBill = new NewBill({
        document,
        onNavigate,
        mockStore,
        localStorage: window.localStorage,
      });

      const file = new File(['hello'], 'hello.txt', { type: 'document/txt' });
      const inputFile = screen.getByTestId('file');

      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      inputFile.addEventListener('change', handleChangeFile);

      fireEvent.change(inputFile, { target: { files: [file] } });

      expect(handleChangeFile).toHaveBeenCalledTimes(1);
      expect(inputFile.files[0].type).toBe('document/txt');

      const errorMessage = document.querySelector('.error-message');
      await waitFor(() => errorMessage);
      expect(errorMessage.classList.contains('hidden')).toBeFalsy();
    });
  });

  describe('when I upload a file with the good format', () => {
    test('then input file should show the file name', async () => {
      document.body.innerHTML = NewBillUI();
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const file = new File(['img'], 'image.png', { type: 'image/png' });
      const inputFile = screen.getByTestId('file');

      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      inputFile.addEventListener('change', handleChangeFile);

      fireEvent.change(inputFile, { target: { files: [file] } });

      expect(handleChangeFile).toHaveBeenCalled();
      expect(inputFile.files[0]).toStrictEqual(file);
      expect(inputFile.files[0].name).toBe('image.png');

      const errorMessage = document.querySelector('.error-message');
      await waitFor(() => errorMessage);
      expect(errorMessage.classList.contains('hidden')).toBeTruthy;
    });
  });
});

//test d'intégration POST

describe('Given I am connected as Employee on NewBill page, and submit the form', () => {
  beforeEach(() => {
    jest.spyOn(mockStore, 'bills');

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      'user',
      JSON.stringify({
        type: 'Employee',
        email: 'a@a',
      })
    );
    const root = document.createElement('div');
    root.setAttribute('id', 'root');
    document.body.append(root);
    router();
  });

  describe('when APi is working well', () => {
    test('then i should be sent on bills page with bills updated', async () => {
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorageMock,
      });

      const form = screen.getByTestId('form-new-bill');
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      form.addEventListener('submit', handleSubmit);

      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();
      expect(screen.getByText('Mes notes de frais')).toBeTruthy();
      expect(mockStore.bills).toHaveBeenCalled();
    });

    describe('When an error occurs on API', () => {
      test('then it should display a message error', async () => {
        console.error = jest.fn();
        window.onNavigate(ROUTES_PATH.NewBill);
        mockStore.bills.mockImplementationOnce(() => {
          return {
            update: () => {
              return Promise.reject(new Error('Erreur 404'));
            },
          };
        });

        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        const form = screen.getByTestId('form-new-bill');
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
        form.addEventListener('submit', handleSubmit);

        fireEvent.submit(form);

        expect(handleSubmit).toHaveBeenCalled();

        await new Promise(process.nextTick);

        expect(console.error).toHaveBeenCalled();
      });
    });
  });
});
