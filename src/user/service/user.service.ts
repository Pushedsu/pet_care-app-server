import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserReqDto } from '../dto/user.request.dto';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../user.repository';
import { Types } from 'mongoose';
import { UserDeleteReqDto } from '../dto/user.delete.req.dto';
import { UserReqUpdateNameDto } from '../dto/user.req.updateName.dto';
import { UserReqUpdatePasswordDto } from '../dto/user.req.updatepw.dto';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getUserAllData() {
    const userAllData = await this.userRepository.findAll();
    const newReadOnlyData = userAllData.map((user) => user.readOnlyData);
    return newReadOnlyData;
  }

  async updateName(body: UserReqUpdateNameDto) {
    const { id, name } = body;
    const updateName = await this.userRepository.updateName(id, name);
    return updateName;
  }

  async updatePassword(body: UserReqUpdatePasswordDto) {
    const { id, password, currentPassword } = body;

    const user = await this.userRepository.findUserById(id);

    if (!user) {
      throw new UnauthorizedException('이메일이 존재하지 않습니다');
    }

    const checkPassword: boolean = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!checkPassword) {
      throw new UnauthorizedException('비밀번호가 일치하지 않습니다');
    }

    return await this.userRepository.updatePassword(id, password);
  }

  async logout(id: Types.ObjectId) {
    const result = await this.userRepository.deleteRefreshToken(id);
    return result;
  }

  async deleteUser(id: Types.ObjectId, body: UserDeleteReqDto) {
    const { password } = body;

    const user = await this.userRepository.findUserById(id);

    if (!user) {
      throw new UnauthorizedException('Object_id가 존재하지 않습니다');
    }

    const checkPassword: boolean = await bcrypt.compare(
      password,
      user.password,
    );

    if (!checkPassword) {
      throw new UnauthorizedException('비밀번호가 일치하지 않습니다');
    }

    return await this.userRepository.findUserByIdAndDelete(user.id);
  }

  async signUp(body: UserReqDto) {
    const { email, name, password } = body;

    const refreshToken = null;

    const image = '';

    const isEmailExists = await this.userRepository.ExistsByEmail(email);

    const hashedPassword = await bcrypt.hash(password, 10);

    if (isEmailExists) {
      throw new UnauthorizedException('입력한 이메일이 존재합니다. ');
    }

    const user = await this.userRepository.create({
      email,
      name,
      password: hashedPassword,
      refreshToken,
      image,
    });

    return user.readOnlyData;
  }

  async updateImgUrl(id: Types.ObjectId, url: string) {
    return await this.userRepository.updateImgUrl(id, url);
  }
}
