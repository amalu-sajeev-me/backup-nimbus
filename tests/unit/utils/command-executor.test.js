import { executeCommand, commandExists } from '../../../src/utils/command-executor.js';
import { exec } from 'child_process';
import logger from '../../../src/utils/logger.js';

// Mock child_process.exec and logger
jest.mock('child_process', () => ({
  exec: jest.fn()
}));

jest.mock('../../../src/utils/logger.js', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('Command Executor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('executeCommand should execute command and resolve with output on success', async () => {
    // Setup mock implementation for successful command
    const mockChildProcess = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn()
    };
    
    // Mock callbacks
    const stdoutCallback = {};
    const stderrCallback = {};
    const closeCallback = {};
    const errorCallback = {};
    
    mockChildProcess.stdout.on.mockImplementation((event, callback) => {
      stdoutCallback[event] = callback;
      return mockChildProcess.stdout;
    });
    
    mockChildProcess.stderr.on.mockImplementation((event, callback) => {
      stderrCallback[event] = callback;
      return mockChildProcess.stderr;
    });
    
    mockChildProcess.on.mockImplementation((event, callback) => {
      if (event === 'close') closeCallback.close = callback;
      if (event === 'error') errorCallback.error = callback;
      return mockChildProcess;
    });
    
    exec.mockReturnValue(mockChildProcess);
    
    // Start the command execution
    const commandPromise = executeCommand('test command', 5000);
    
    // Emit some stdout data
    stdoutCallback.data('Command output line 1\n');
    stdoutCallback.data('Command output line 2\n');
    
    // Emit stdout data with progress percentage
    stdoutCallback.data('Progress: 50.0%\n');
    stdoutCallback.data('Progress: 100.0%\n');
    
    // Emit some stderr data
    stderrCallback.data('Some warning\n');
    
    // Emit close event with success code
    closeCallback.close(0);
    
    // Wait for promise to resolve
    const result = await commandPromise;
    
    // Verify exec was called correctly
    expect(exec).toHaveBeenCalledWith('test command', {
      maxBuffer: 20 * 1024 * 1024, // 20MB
      timeout: 5000
    });
    
    // Verify stdout data handling
    expect(logger.info).toHaveBeenCalledWith(`Progress: Progress: 100.0%`);
    
    // Verify result contains stdout
    expect(result).toBe('Command output line 1\nCommand output line 2\nProgress: 50.0%\nProgress: 100.0%\n');
  });

  test('executeCommand should reject with error when command fails', async () => {
    // Setup mock implementation for failed command
    const mockChildProcess = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn()
    };
    
    // Mock callbacks
    const stdoutCallback = {};
    const stderrCallback = {};
    const closeCallback = {};
    
    mockChildProcess.stdout.on.mockImplementation((event, callback) => {
      stdoutCallback[event] = callback;
      return mockChildProcess.stdout;
    });
    
    mockChildProcess.stderr.on.mockImplementation((event, callback) => {
      stderrCallback[event] = callback;
      return mockChildProcess.stderr;
    });
    
    mockChildProcess.on.mockImplementation((event, callback) => {
      if (event === 'close') closeCallback.close = callback;
      return mockChildProcess;
    });
    
    exec.mockReturnValue(mockChildProcess);
    
    // Start the command execution
    const commandPromise = executeCommand('test command', 5000);
    
    // Emit some stderr data
    stderrCallback.data('Command failed with error\n');
    
    // Emit close event with error code
    closeCallback.close(1);
    
    // Wait for promise to reject
    await expect(commandPromise).rejects.toThrow('Command failed: Command failed with error');
  });

  test('executeCommand should reject when child process emits error', async () => {
    // Setup mock implementation
    const mockChildProcess = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn()
    };
    
    // Mock callbacks
    const errorCallback = {};
    
    mockChildProcess.stdout.on.mockImplementation(() => mockChildProcess.stdout);
    mockChildProcess.stderr.on.mockImplementation(() => mockChildProcess.stderr);
    
    mockChildProcess.on.mockImplementation((event, callback) => {
      if (event === 'error') errorCallback.error = callback;
      return mockChildProcess;
    });
    
    exec.mockReturnValue(mockChildProcess);
    
    // Start the command execution
    const commandPromise = executeCommand('test command', 5000);
    
    // Emit error event
    errorCallback.error(new Error('Command not found'));
    
    // Wait for promise to reject
    await expect(commandPromise).rejects.toThrow('Command execution error: Command not found');
  });

  test('commandExists should return true if command exists', async () => {
    // Mock executeCommand directly instead of global
    const originalExecuteCommand = executeCommand;
    global.executeCommand = jest.fn().mockResolvedValue('command exists');
    
    const result = await commandExists('node');
    
    expect(result).toBe(true);
    
    // Restore original function
    global.executeCommand = originalExecuteCommand;
  });

  test('commandExists should return false if command does not exist', async () => {
    // Mock executeCommand directly
    const originalExecuteCommand = executeCommand;
    global.executeCommand = jest.fn().mockRejectedValue(new Error('command not found'));
    
    const result = await commandExists('nonexistentcommand');
    
    expect(result).toBe(false);
    
    // Restore original function
    global.executeCommand = originalExecuteCommand;
  });
});