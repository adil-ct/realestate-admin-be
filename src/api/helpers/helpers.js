import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const checkPassword = async (enteredPassword, storedPassword) => {
  return await bcrypt.compare(enteredPassword, storedPassword);
};

const generateuuid = async () => {
  return uuidv4();
};

const GenerateRandomStringOfLength = (length) => {
  try {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  } catch (err) {
    logger.error(err);
  }
};

const GenerateRandomNumberOfLength = (length) => {
  let result = '';
  const characters = '0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export { checkPassword, generateuuid, GenerateRandomStringOfLength, GenerateRandomNumberOfLength };
