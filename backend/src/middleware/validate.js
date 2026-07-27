



function validate(schema, part = 'body') {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req[part], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      error.statusCode = 400;
      return next(error);
    }

    req[part] = value;
    next();
  };
}

module.exports = validate;
