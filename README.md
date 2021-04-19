# TubeAudioDownloader

## App Install

### You will need to install [Python3.8](https://www.python.org/downloads/release/python-389/)

- **macOS**

You will have to **manually add** the PATH for python3.8 after starting the application. &#x1f628; (You will see a window for that.)  
Please check the directory where python3.8 exists. &#x1f609;

- **Windows**

Python3.8 installation using WindowsStore is **not recommended** because PATH is not added. &#x1f62d;

## Package Build

- **macOS**

1. Install npm packages

   ```bash
   yarn install
   ```

1. Build renderer

   ```bash
   yarn build_r
   ```

1. Build App

   ```bash
   yarn build_e
   ```

- **Windows**

1. Install npm packages

   ```powershell
   yarn install
   ```

1. Build renderer

   ```powershell
   yarn build_r
   ```

1. Build App

   ```powershell
   yarn build_e_win
   ```

## Development

### Install dependencies

```bash
yarn install
```

### Serve Renderer

```bash
yarn start_r
```

### Build Renderer

```bash
yarn build_r
```

### Start electron

```bash
yarn start_e
```

### Build electron App

```bash
yarn build_e
```
