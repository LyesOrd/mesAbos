import { Test, TestingModule } from '@nestjs/testing';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthenticatedRequest, UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            getMe: jest.fn(),
            updateMe: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<jest.Mocked<UsersService>>(UsersService);
  });

  it('reads the authenticated user id when returning the current profile', async () => {
    const request: AuthenticatedRequest = {
      user: { id: 'user-123', email: 'john@doe.test', name: 'John Doe' },
    };

    usersService.getMe.mockResolvedValue({
      id: 'user-123',
      email: 'john@doe.test',
      name: 'John Doe',
      provider: 'LOCAL',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await controller.getMe(request);

    expect(usersService.getMe).toHaveBeenCalledWith('user-123');
  });

  it('reads the authenticated user id when updating the profile', async () => {
    const request: AuthenticatedRequest = {
      user: { id: 'user-456', email: 'jane@doe.test', name: 'Jane Doe' },
    };
    const payload: UpdateUserDto = { name: 'Jane Updated' };

    usersService.updateMe.mockResolvedValue({
      id: 'user-456',
      email: 'jane@doe.test',
      name: 'Jane Updated',
      provider: 'LOCAL',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await controller.updateMe(request, payload);

    expect(usersService.updateMe).toHaveBeenCalledWith('user-456', payload);
  });
});
