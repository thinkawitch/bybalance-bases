
var log = console.log || function(){};

var accounts = {
    kAccountMts: 1,
    kAccountBn: 2,
    kAccountVelcom: 3,
    kAccountLife: 4,
    kAccountTcm: 5,
    kAccountNiks: 6,
    kAccountDamavik: 7,
    kAccountSolo: 8,
    kAccountTeleset: 9,
    kAccountByFly: 10,
    kAccountNetBerry: 11,
    kAccountCosmosTv: 12,
    kAccountAtlantTelecom: 13,
    kAccountInfolan: 14,
    kAccountUnetBy: 15,
    kAccountDiallog: 16,
    kAccountAnitex: 17,
    kAccountAdslBy: 18
};

var accountsFunctions = {
    id_1: 'extractMts',
    id_2: 'extractBn',
    id_3: 'extractVelcom',
    id_4: 'extractLife'
};

function getExtractFunction(type)
{
    log('getExtractFunction type:' + type);
    var prop = 'id_'+type;
    var funcName = accountsFunctions[prop] ? accountsFunctions[prop] : null;
    if (!funcName) return null;
    return this[funcName] ? this[funcName] : null;
}

function prepareResult()
{
    return {
        notSupported: false,
        extracted: false,
        incorrectLogin: false,
        balance: 0,
        bonuses: ''
    };
}

function extractData(type, html)
{
    log('extractData type:' + type);
    //log(html);

    var func = getExtractFunction(type);
    if (!func || typeof func != 'function')
    {
        var r = prepareResult();
        r.notSupported = true;
        return r;
    }

    return func(html);
}

function getIntegerNumber(str, separator)
{
    separator = separator || '.';

    str = str.replace(/руб./g, ''); //mts,bn,velcom

    if (separator == '.')
    {
        str = str.replace(/[^0-9.\-]/g, '');
    }
    else
    {
        str = str.replace(/[^0-9,\-]/g, '');
        str = str.replace(',', '.');
    }

    return parseInt(str);
}

function extractMts(html)
{
    var r = prepareResult();

    var re = /<div class="logon-result-block">([\s\S]+)<\/div>/mi;
    if (html.match(re))
    {
        r.incorrectLogin = true;
        return r;
    }

    re = /<span id="customer-info-balance"><strong>([\s\S]+)<\/strong>/mi;
    var matches = html.match(re);
    if (matches && matches.length == 2)
    {
        var balance = getIntegerNumber(matches[1], ',');
        log('balance', balance);
        r.extracted = true;
        r.balance = balance;
    }
    log(matches);

    return r;
}

function extractBn(html)
{
    var r = prepareResult();

    var re = /<div class=('alarma'|"alarma")>([^<]+)<\/div>/mi;
    if (html.match(re))
    {
        r.incorrectLogin = true;
        return r;
    }

    re = /Текущий баланс:<\/td><td>([^<]+)<\/td>/mi;
    var matches = html.match(re);
    if (matches && matches.length == 2)
    {
        var balance = getIntegerNumber(matches[1], ',');
        log('balance', balance);
        r.extracted = true;
        r.balance = balance;
    }
    log('matches', matches);

    return r;
}

function extractVelcom(html)
{
    var r = prepareResult();

    if (html.indexOf('INFO_Error_caption') > -1)
    {
        r.incorrectLogin = true;
        return r;
    }

    var i, regexp, matches, balance;
    var balanceMarkers = [
        /баланс:<\/td><td class="INFO">([^<]+)/mi,
        /"Начисления\s*абонента\*:<\/td><td class="INFO">([^<]+)/mi,
        /<td[^>]*id="BALANCE"[^>]*><span>\s*([^<]+)/mi,
        /<td[^>]*id="contractCharge"[^>]*><span>\s*([^<]+)/mi
    ];

    for (i=0; i<balanceMarkers.length; i++)
    {
        regexp = balanceMarkers[i];
        matches = html.match(regexp);
        log(regexp, matches);
        if (matches && matches.length == 2)
        {
            balance = getIntegerNumber(matches[1]);
            r.extracted = true;
            r.balance = balance;
            break;
        }
    }

    if (r.extracted)
    {
        log('search for bonuses');
        var bonusLine, bonuses = [];
        var bonusesMarkers = [
            /<td[^>]*id="DISCOUNT"[^>]*><span>\s*([^<]+)/mi,
            /<td[^>]*id="TraficBalance"[^>]*><span>\s*([^<]+)/mi
        ];

        for (i=0; i<bonusesMarkers.length; i++)
        {
            regexp = bonusesMarkers[i];
            matches = html.match(regexp);
            log(regexp, matches);
            if (matches && matches.length == 2)
            {
                bonusLine = String(matches[1]).trim();
                if (bonusLine.length > 1) bonuses.push(bonusLine);
            }
        }

        if (bonuses.length > 0) r.bonuses = bonuses.join(' ');
    }

    return r;
}

function extractLife(html)
{
    var r = prepareResult();

    if (html.indexOf('class="log-out"') == -1)
    {
        r.incorrectLogin = true;
        return r;
    }

    var i, regexp, matches, balance;
    var balanceMarkers = [
        /Основной баланс\s*<\/td>\s*<td[^>]*>([^<]+)руб/mi,
        /Основной счет\s*<\/td>\s*<td[^>]*>([^<]+)руб/mi
    ];

    for (i=0; i<balanceMarkers.length; i++)
    {
        regexp = balanceMarkers[i];
        matches = html.match(regexp);
        log(regexp, matches);
        if (matches && matches.length == 2)
        {
            balance = getIntegerNumber(matches[1]);
            r.extracted = true;
            r.balance = balance;
            break;
        }
    }

    return r;
}


var bb = {
    title: 'Базы приложения',
    version: '1411.3.19'
};

//end