import { buildLayout, buildDownloadUrl, getVoltaVersion, getOpenSSLVersion } from './installer';
import { createTempDir } from 'broccoli-test-helper';
import nock from 'nock';

describe('buildDownloadUrl', () => {
  test('darwin', async function () {
    expect(await buildDownloadUrl('darwin', '0.6.4')).toMatchInlineSnapshot(
      `"https://github.com/volta-cli/volta/releases/download/v0.6.4/volta-0.6.4-macos.tar.gz"`
    );
  });

  test('linux', async function () {
    expect(
      await buildDownloadUrl('linux', '0.6.4', '', 'OpenSSL 1.0.1e-fips 11 Feb 2013')
    ).toMatchInlineSnapshot(
      `"https://github.com/volta-cli/volta/releases/download/v0.6.4/volta-0.6.4-linux-openssl-1.0.tar.gz"`
    );

    expect(
      await buildDownloadUrl('linux', '0.6.4', '', 'OpenSSL 1.1.1e-fips 11 Sep 2018')
    ).toMatchInlineSnapshot(
      `"https://github.com/volta-cli/volta/releases/download/v0.6.4/volta-0.6.4-linux-openssl-1.1.tar.gz"`
    );
  });

  test('linux with variant input', async function () {
    expect(await buildDownloadUrl('linux', '0.6.4', 'linux-openssl-rhel')).toMatchInlineSnapshot(
      `"https://github.com/volta-cli/volta/releases/download/v0.6.4/volta-0.6.4-linux-openssl-rhel.tar.gz"`
    );
  });

  test('win32', async function () {
    expect(await buildDownloadUrl('win32', '0.7.2')).toMatchInlineSnapshot(
      `"https://github.com/volta-cli/volta/releases/download/v0.7.2/volta-0.7.2-windows-x86_64.msi"`
    );
  });

  test('aix', async function () {
    expect(
      async () => await buildDownloadUrl('aix', '0.6.4')
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"your platform aix is not yet supported"`);
  });
});

describe('getOpenSSLVersion', () => {
  test('1.0', async function () {
    expect(await getOpenSSLVersion('OpenSSL 1.0.1e-fips 11 Feb 2013')).toMatchInlineSnapshot(
      `"openssl-1.0"`
    );
  });

  test('1.1', async function () {
    expect(await getOpenSSLVersion('OpenSSL 1.1.1e-fips 11 Sep 2018')).toMatchInlineSnapshot(
      `"openssl-1.1"`
    );
  });
});

describe('buildLayout', () => {
  test('creates the rough folder structure', async () => {
    const tmpdir = await createTempDir();

    tmpdir.write({
      bin: {
        shim: 'shim-file-here',
      },
    });

    await buildLayout(tmpdir.path());

    expect(tmpdir.read()).toMatchInlineSnapshot(`
      Object {
        "bin": Object {
          "node": "shim-file-here",
          "npm": "shim-file-here",
          "npx": "shim-file-here",
          "shim": "shim-file-here",
          "yarn": "shim-file-here",
        },
        "cache": Object {
          "node": Object {},
        },
        "log": Object {},
        "tmp": Object {},
        "tools": Object {
          "image": Object {
            "node": Object {},
            "packages": Object {},
            "yarn": Object {},
          },
          "inventory": Object {
            "node": Object {},
            "packages": Object {},
            "yarn": Object {},
          },
          "user": Object {},
        },
      }
    `);
  });
});

describe('getVoltaVersion', function () {
  it('without user provided volta version', async function () {
    try {
      const scope = nock('https://api.github.com')
        .get('/repos/volta-cli/volta/releases/latest')
        .reply(200, '{ "name": "v999.999.999" }');

      expect(await getVoltaVersion('', 'some-token')).toEqual('999.999.999');

      scope.done();
    } finally {
      nock.restore();
    }
  });

  it('with user provided volta version', async function () {
    expect(await getVoltaVersion('1.0.1', 'some-token')).toEqual('1.0.1');
  });

  it('errors for older volta versions', async function () {
    expect(
      async () => await getVoltaVersion('0.6.5', 'some-token')
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"volta-cli/action: Volta version must be >= 1.0.0 (you specified 0.6.5)"`
    );
  });
});
