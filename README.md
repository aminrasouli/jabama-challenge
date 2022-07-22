<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456

[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A Project Based On <a href="https://docs.nestjs.com/" target="_blank">Nest.js</a> framework for Jabama Challenge.</p>

## Description

This Project is written by [Nest](https://github.com/nestjs/nest) framework TypeScript.

## Techology And Libraries Used

- **docker** and docker-compose for development environment
- **postgresql** as a RDBMS(Relational Database Management System)
- **prisma** as ORM(Object Relational Mapping)
- **@nestjs-modules/mailer** and nodemailer for sending emails with SMTP
- **redis** as a queue storage for persistent data
- **@nestjs/bull** and bull for queueing jobs
- **@nestjs/event-emitter** for handling events listeners pattern
- **winston** and nest-winston for logging
- **winston-transport-sentry-node** for sending logs to sentry.io

## Running the app and database using Docker Compose

copy .env.example to .env and change the values to match your environment

```bash
cp .env.example .env
```

```bash
docker-compose up --build
```

or

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## OpenAPI(Swagger) Documentation

```bash
localhost:3000/api/docs
```

## License

Nest is [MIT licensed](LICENSE).
