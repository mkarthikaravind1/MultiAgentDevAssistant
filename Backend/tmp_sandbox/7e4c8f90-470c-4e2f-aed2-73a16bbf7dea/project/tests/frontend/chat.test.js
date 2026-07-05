import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import Chat from '../../src/components/Chat';
import { WebSocket } from 'ws';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const server = setupServer(
  rest.post('/api/messages', (req, res, ctx) => {
    return res(ctx.json({ message: 'Hello from server' }));
  })
);

describe('Chat component', () => {
  beforeEach(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
    server.close();
  });

  it('renders chat input and sends message', async () => {
    const { getByPlaceholderText, getByText } = render(<Chat />);
    const input = getByPlaceholderText('Type a message');
    const button = getByText('Send');

    fireEvent.change(input, { target: { value: 'Hello from client' } });
    fireEvent.click(button);

    await waitFor(() => expect(getByText('Hello from client')).toBeInTheDocument());
    await waitFor(() => expect(getByText('Hello from server')).toBeInTheDocument());
  });

  it('displays error message when sending message fails', async () => {
    server.use(
      rest.post('/api/messages', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Error sending message' }));
      })
    );

    const { getByPlaceholderText, getByText } = render(<Chat />);
    const input = getByPlaceholderText('Type a message');
    const button = getByText('Send');

    fireEvent.change(input, { target: { value: 'Hello from client' } });
    fireEvent.click(button);

    await waitFor(() => expect(getByText('Error sending message')).toBeInTheDocument());
  });
});