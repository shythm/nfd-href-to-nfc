const cheerio = require('cheerio');
const prompt = require('prompt-sync')({ sigint: true });
const fs = require('fs');
const path = require('path');

function convertToEncodedNfc(str) {
    str = decodeURI(str);
    str = str.normalize('NFC');
    str = encodeURI(str);
    return str;
}

function convertHtmlPathToNfc(filePath) {
    if (!filePath) {
        throw new Error(`filePath is ${filePath}.`);
    }
    if (!filePath.endsWith('.html')) {
        throw new Error(`${filePath}는 html 파일이 아닙니다.`);
    }
    if (!fs.existsSync(filePath)) {
        throw new Error(`${filePath} 파일이 존재하지 않습니다.`);
    }

    const html = fs.readFileSync(filePath, 'utf8');
    const $ = cheerio.load(html);

    $('a[href]').each(function () {
        let href = $(this).attr('href');
        href = convertToEncodedNfc(href);
        $(this).attr('href', href);
    });

    $('img[src]').each(function () {
        let src = $(this).attr('src');
        src = convertToEncodedNfc(src);
        $(this).attr('src', src);
    });

    const updatedHtml = $.html();
    fs.writeFileSync(filePath, updatedHtml, 'utf8');
}

function getFilesInDirectory(dir) {
    let results = [];
    const list = fs.readdirSync(dir);

    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);

        if (stat.isDirectory()) {
            results = results.concat(getFilesInDirectory(file));
        } else {
            results.push(file);
        }
    });

    return results;
}

function main() {
    const args = process.argv.slice(2);
    const option = args[0];
    const path = args[1];

    if (option === '-f') {
        // -f 옵션을 주면 html 파일의 모든 파일 경로에 대한 태그의 값을 NFC 형식으로 변경하여 저장
        convertHtmlPathToNfc(path);
    } else if (option === '-d') {
        // -d 옵션을 주면 디렉터리 내의 모든 html의 파일 경로 값을 NFC 형식으로 바꾸어 저장
        const files = getFilesInDirectory(path).filter(file => file.endsWith('.html') || file.endsWith('.htm'));
        console.log('다음의 HTML 파일 내의 모든 경로 값을 NFC 형식으로 바꾸어 인코딩합니다.', files);
        if (prompt('계속하시겠습니까? (y/n) ') === 'y') {
            files.forEach(convertHtmlPathToNfc)
        } else {
            console.log('취소되었습니다.');
            return 0;
        }
    } else {
        throw new Error('잘못된 옵션입니다.');
    }

    return 0;
}

try {
    main();
} catch (err) { 
    console.error(err);
    process.exit(1);
}