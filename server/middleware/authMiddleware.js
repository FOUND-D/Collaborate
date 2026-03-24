const jwt = require('jsonwebtoken');
const { getUserById } = require('../lib/repo');

const protect = async (req, res, next) => {
  try {
    console.log('protect middleware: auth header present =', Boolean(req.headers.authorization));
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, not authorized' });
    }

    const token = authHeader.split(' ')[1];

    if (!process.env.JWT_SECRET) {
      console.error('FATAL: JWT_SECRET env var is not set');
      return res.status(500).json({ message: 'Server misconfiguration' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('protect middleware: token decoded for user id =', decoded.id);

    const user = await getUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('protect middleware error:', err.message);
    if (
      err.name === 'JsonWebTokenError' ||
      err.name === 'TokenExpiredError' ||
      err.name === 'CastError'
    ) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
    return res.status(500).json({ message: 'Auth middleware error' });
  }
};

module.exports = { protect };
