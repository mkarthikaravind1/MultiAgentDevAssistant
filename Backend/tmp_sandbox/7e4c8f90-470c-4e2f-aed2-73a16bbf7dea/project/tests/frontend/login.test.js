import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import Login from '../../src/components/Login';

const server = setupServer(
  rest.post('/api/login', (req, res, ctx) => {
    return res(ctx.json({ token: 'test-token' }));
  }),
);

describe('Login component', () => {
  afterEach(() => server.resetHandlers());

  it('renders login form', () => {
    const { getByPlaceholderText } = render(<Login />);
    expect(getByPlaceholderText('Username')).toBeInTheDocument();
    expect(getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('submits login form', async () => {
    const { getByPlaceholderText, getByText } = render(<Login />);
    const usernameInput = getByPlaceholderText('Username');
    const passwordInput = getByPlaceholderText('Password');
    const submitButton = getByText('Login');

    fireEvent.change(usernameInput, { target: { value: 'test-username' } });
    fireEvent.change(passwordInput, { target: { value: 'test-password' } });
    fireEvent.click(submitButton);

    await waitFor(() => expect(server.handlers[0].ctx.request.body).toEqual({
      username: 'test-username',
      password: 'test-password',
    }));
  });

  it('displays error message on failed login', async () => {
    server.use(
      rest.post('/api/login', (req, res, ctx) => {
        return res(ctx.status(401), ctx.json({ error: 'Invalid credentials' }));
      }),
    );

    const { getByPlaceholderText, getByText } = render(<Login />);
    const usernameInput = getByPlaceholderText('Username');
    const passwordInput = getByPlaceholderText('Password');
    const submitButton = getByText('Login');

    fireEvent.change(usernameInput, { target: { value: 'test-username' } });
    fireEvent.change(passwordInput, { target: { value: 'test-password' } });
    fireEvent.click(submitButton);

    await waitFor(() => expect(getByText('Invalid credentials')).toBeInTheDocument());
  });
});