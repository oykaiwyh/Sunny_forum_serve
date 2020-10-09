import config from '@/config'
import User from '@/model/user'
import {
    setValue
} from '@/config/RedisConfig'

export const run = async () => {
    if (config.SuperAdmin && config.SuperAdmin.length > 0) {
        const superuser = config.SuperAdmin
        const arr = []
        for (const name of superuser) {

            const user = await User.findOne({
                username: name
            })
            if (user) {
                arr.push(user._id)
            }
        }
        setValue('superadmin', JSON.stringify(arr))
    }
}