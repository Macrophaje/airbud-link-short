# airbud-link-short

This is a link shortening service built with Express JS. It has both a front end website at https://www.airbud.dog as well as an open API to consume from your own apps.

## API

In order to make API requests, send a POST request to https://www.airbud.dog/api/shorturl.
Include in your request header `'Content-type', 'application/json; charset=utf-8'`.
In your request body, include a JSON object with the following shape:

```
{
    'url': <URL to be shortened>,
    'shortCode': <custom short code> //optional
}
```

You will recieve a response in the form of a JSON object with one of two possible shpes:

**1)**
```
{
    "shortUrl": <Your short URL>
}
```

**2)**
```
{
    "error": <Some error>
}
```
